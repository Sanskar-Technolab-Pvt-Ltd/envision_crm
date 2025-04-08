frappe.ui.form.on("Cost Estimation", {
  refresh: function (frm) {
    // Apply the filter when the form loads or refreshes
    
    if (frm.doc.docstatus === 0) {
      frappe.db
        .get_list("Quotation", {
          filters: {
            custom_cost_estimation: frm.doc.name,
          },
          fields: ["name", "docstatus"],
        })
        .then((quotations) => {
          const hasDraftOrSubmitted = quotations.some(
            (ce) => ce.docstatus === 0 || ce.docstatus === 1
          );

          // Add button only if no draft or submitted quotations exist
          if (!hasDraftOrSubmitted) {
            frm.add_custom_button("Create Quotation", () => {
              frappe.confirm(
                "Are you sure you want to create a Quotation?",
                function () {
                  frappe.call({
                    method:
                      "envision_crm.envision_crm.api.create_quotation.make_quotation_from_cost_estimation",
                    args: {
                      cost_estimation_id: frm.doc.name,
                    },
                    callback: function (r) {
                      if (!r.exc) {
                        frappe.model.sync(r.message);
                        frappe.set_route(
                          "Form",
                          r.message.doctype,
                          r.message.name
                        );
                      }
                    },
                  });
                }
              );
            });
          }
        });
    }
  }, // End refresh event

  project_template: function (frm) {
    let project_template = frm.doc.project_template || "";
    frappe.call({
      method:
        "envision_crm.envision_crm.api.get_data.get_project_template_task_list",
      args: {
        Project_template_id: frm.doc.project_template,
      },
      callback: function (r) {
        if (!r.exc) {

          let task_mapping = r.message;

          task_mapping.forEach((task) => {
            // Add a new row for each child task

            let row = frm.add_child("man_days");
            // Set the parent task's subject in the "stages_of_project" field
            frappe.model.set_value(
              row.doctype,
              row.name,
              "parent_task",
              task.task
            );
            frappe.model.set_value(
              row.doctype,
              row.name,
              "stages_of_project",
              task.subject
            );

            frappe.model.set_value(
              row.doctype,
              row.name,
              "project_template",
              project_template
            );
            // console.log("Template name ", project_template);
          });

          // Refresh the child table after adding rows
          frm.refresh_field("man_days");

          setTimeout(() => {
            frm.set_value("project_template", "");
          }, 500);
        }
      },
    });
  },

  total_basic_cost: function (frm) {
    calculate_margin_percentage(
      frm,
      "margin_amount",
      "total_basic_cost",
      "margin_percentage"
    );
  },

  margin_amount: function (frm) {
    calculate_margin_percentage(
      frm,
      "margin_amount",
      "total_basic_cost",
      "margin_percentage"
    );

    calculate_margin_percentage(
      frm,
      "margin_amount",
      "total_quoted_amount",
      "margin_on_sale"
    );
  },
  total_quoted_amount: function (frm) {
    calculate_margin_percentage(
      frm,
      "margin_amount",
      "total_quoted_amount",
      "margin_on_sale"
    );

    calculate_margin_percentage(
      frm,
      "total_man_days_amount",
      "total_quoted_amount",
      "percent_man_days_on_total_quote_amount"
    );

    calculate_margin_percentage(
      frm,
      "total_other_expense",
      "total_quoted_amount",
      "other_expense_on_total_quote_amount_percentage"
    );
  },

  // Projects department Profit calculate

  total_erection_amount: function (frm, cdt, cdn) {

    calculate_selling_item_wise_amounts(
      frm,
      "cost_estimation_expense",
      "total_amount_with_erection",
      "quotation_items",
      "rate"
    );
  },

 
  total_man_days_amount: function (frm) {
    
    frm.refresh_field(frm.doc.quotation_items);

    calculate_selling_item_wise_amounts(
      frm,
      "man_days",
      "total_amount",
      "quotation_items",
      "estimated_man_days"
    );

    calculate_margin_percentage(
      frm,
      "total_man_days_amount",
      "total_quoted_amount",
      "percent_man_days_on_total_quote_amount"
    );
  },
  total_other_expense: function (frm) {
    calculate_selling_item_wise_amounts(
      frm,
      "other_expense",
      "amount",
      "quotation_items",
      "estimated_other_exp"
    );

    calculate_margin_percentage(
      frm,
      "total_other_expense",
      "total_quoted_amount",
      "other_expense_on_total_quote_amount_percentage"
    );
   
  },
});

// Selling Item table
frappe.ui.form.on("Quotation Selling Items", {
  quotation_items_add: function (frm, cdt, cdn) {
    // Only show items where is_sales_item is enabled
    frm.fields_dict["quotation_items"].grid.get_field("item_code").get_query =
      function () {
        return {
          filters: {
            is_sales_item: 1,
          },
        };
      };
  },
  rate: function (frm, cdt, cdn) {
    calculate_amount(frm, cdt, cdn);
    calculate_selling_item_total_cost(frm, cdt, cdn);
    update_totals_of_selling_items(frm);
  },
  quantity: function (frm, cdt, cdn) {
    calculate_amount(frm, cdt, cdn);
    calculate_selling_item_total_cost(frm, cdt, cdn);
    calculate_quote_price(frm, cdt, cdn);
    calculate_quote_amount(frm, cdt, cdn);
  },

  estimated_man_days: function (frm, cdt, cdn) {
    calculate_selling_item_total_cost(frm, cdt, cdn);
  },
  estimated_other_exp: function (frm, cdt, cdn) {
    calculate_selling_item_total_cost(frm, cdt, cdn);
  },
  profit_percentage: function (frm, cdt, cdn) {
    calculate_selling_item_wise_margin_amount(frm, cdt, cdn);
    // update_totals_of_selling_items(frm);
  },
  amount: function (frm, cdt, cdn) {
    calculate_selling_item_wise_margin_amount(frm, cdt, cdn);
    // update_totals_of_selling_items(frm);
  },

  margin_amount: function (frm, cdt, cdn) {
    calculate_quote_price(frm, cdt, cdn);
    // update_totals_of_selling_items(frm);
  },

  total_cost: function (frm, cdt, cdn) {
    calculate_quote_price(frm, cdt, cdn);
    // update_totals_of_selling_items(frm);
  },

  quote_price: function (frm, cdt, cdn) {
    calculate_quote_amount(frm, cdt, cdn);
    // update_totals_of_selling_items(frm);
  },
  quote_amount: function (frm, cdt, cdn) {
    update_totals_of_selling_items(frm);
  },

  quotation_items_remove: function (frm, cdt, cdn) {
    update_totals_of_selling_items(frm);
  },

  unloading_percentage: function (frm, cdt, cdn) {
    sync_percentage_fields(frm, "unloading_percentage");
},
transportation_percentage: function (frm, cdt, cdn) {
    sync_percentage_fields(frm, "transportation_percentage");
},
erection_percentage: function (frm, cdt, cdn) {
    sync_percentage_fields(frm, "erection_percentage");
}
});

// The percentage values are updated in the "Cost Estimation Expense" table
function sync_percentage_fields(frm, fieldname) {
  // both child tables exist before proceeding
  if (frm.doc.quotation_items && frm.doc.cost_estimation_expense) {
    // Iterate through each row in the "Quotation Selling Items" table
      frm.doc.quotation_items.forEach((selling_row) => {
        // Iterate through each row in the "Cost Estimation Expense" table
          frm.doc.cost_estimation_expense.forEach((expense_row) => {
            // If item_code in "Quotation Selling Items" matches selling_item in "Cost Estimation Expense"
              if (selling_row.item_code === expense_row.selling_item) {
                  // Update the percentage field value in "Cost Estimation Expense"
                  frappe.model.set_value(expense_row.doctype, expense_row.name, fieldname, selling_row[fieldname]);
              }
          });
      });
  }
}

function calculate_quote_amount(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let quote_price = current_row.quote_price || 0;
  let quantity = current_row.quantity || 1;
  let quote_amount = 0;

  quote_amount = quote_price * quantity;
  frappe.model.set_value(cdt, cdn, "quote_amount", Math.round(quote_amount));
}
function calculate_quote_price(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let total_cost = current_row.total_cost || 0;
  let margin_amount = current_row.margin_amount || 0;
  let quantity = current_row.quantity || 1;
  let quote_price = 0;

  quote_price = (total_cost + margin_amount) / quantity;
  frappe.model.set_value(cdt, cdn, "quote_price", Math.round(quote_price));
}

function calculate_selling_item_wise_margin_amount(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];

  let margin_amount = calculate_percentage_amount(
    current_row.amount,
    current_row.profit_percentage
  );

  frappe.model.set_value(cdt, cdn, "margin_amount", Math.round(margin_amount));
}

// Calculate amount  by rate * quantity fro quotation item table
function calculate_amount(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let amount = 0;
  amount = (current_row.quantity || 1) * (current_row.rate || 0);

  frappe.model.set_value(cdt, cdn, "amount", Math.round(amount));
}

function calculate_selling_item_total_cost(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let unit_basic_cost = current_row.amount || 0;
  let man_days = current_row.estimated_man_days || 0;
  let other_expense = current_row.estimated_other_exp || 0;
  let total_cost = 0;
  total_cost = unit_basic_cost + man_days + other_expense;

  frappe.model.set_value(cdt, cdn, "total_cost", Math.round(total_cost));
}

function update_totals_of_selling_items(frm) {
  // Initialize totals to zero
  let total_basic_cost = 0,
    total_unit_basic_cost = 0,
    total_cost = 0,
    total_quote_price = 0,
    total_margin_amount = 0,
    total_quoted_amount = 0;

  // Iterate through each row in the child table
  frm.doc.quotation_items.forEach((row) => {
    total_basic_cost += row.amount || 0;
    total_unit_basic_cost += row.rate || 0;
    total_cost += row.total_cost || 0;
    total_quote_price += row.quote_price || 0;
    total_margin_amount += row.margin_amount || 0;
    total_quoted_amount += row.quote_amount || 0;
    // console.log("row cout amount ", row.quote_amount, row);
  });
  // console.log("total_quoted_amount ", total_quoted_amount);

  // Set the calculated totals on the parent fields
  frm.set_value("total_basic_cost", Math.round(total_basic_cost));
  frm.set_value("total_unit_basic_cost", Math.round(total_unit_basic_cost));
  frm.set_value("total_cost", Math.round(total_cost));
  frm.set_value("total_quote_price", Math.round(total_quote_price));
  frm.set_value("margin_amount", Math.round(total_margin_amount));
  frm.set_value("total_quoted_amount", Math.round(total_quoted_amount));

  // Explicitly refresh only the affected fields
  frm.refresh_field("total_basic_cost");
  frm.refresh_field("total_unit_basic_cost");
  frm.refresh_field("total_cost");
  frm.refresh_field("total_quote_price");
  frm.refresh_field("margin_amount");
  frm.refresh_field("total_quoted_amount");
}

function calculate_margin_percentage(
  frm,
  numerator_field,
  denominator_field,
  target_field
) {
  // Get values from the specified fields
  let numerator = frm.doc[numerator_field] || 0;
  let denominator = frm.doc[denominator_field] || 1;

  // Calculate the percentage
  let margin_percentage = 0;
  if (denominator > 0) {
    margin_percentage = (numerator / denominator) * 100;
  }

  // Set the calculated percentage to the target field
  frm.set_value(target_field, margin_percentage);

  // Refresh the target field to reflect updated value
  frm.refresh_field(target_field);
}

// Function to set item for single selling 'selling_item' field
function set_item_for_single_selling_item(frm, cdt, cdn, field_name) {
  // Get the first item from the 'quotation_items' table
  let sellingTable = frm.doc.quotation_items[0];

  if (sellingTable) {
    // Set the value for the specified field in the current row
    frappe.model.set_value(cdt, cdn, {
      [field_name]: sellingTable.item_code || "",
    });
  }
}

// Function to apply a dynamic filter to the 'selling_item' field
function apply_dynamic_filter(frm, field_name, table_name) {
  // Check if quotation_items exist and have more than 1 entry
  if (cur_frm.doc.quotation_items.length > 1) {
    let selected_items = [];

    cur_frm.doc.quotation_items.forEach((row) => {
      selected_items.push(row.item_code);
    });

    // Set a dynamic query on the specified field and table
    cur_frm.set_query(field_name, table_name, function () {
      return {
        filters: [["item_code", "in", selected_items]],
      };
    });

    // Refresh the specified table field to apply the filter
    frm.refresh_field(table_name);
  }
}

function calculate_amount_for_row(
  total_amount,
  cdt,
  cdn,
  percent_field,
  amount_field
) {
  total_amount = total_amount || 0;

  let row = locals[cdt][cdn];

  let percentage = (row[percent_field] || 0) / 100;
  let amount = total_amount * percentage;

  let rate = row.rate + amount;
  // console.log("rate", rate);

  frappe.model.set_value(cdt, cdn, amount_field, amount);
  frappe.model.set_value(cdt, cdn, "rate", rate);

  return amount;
}

// Cost Estimation Expense
frappe.ui.form.on("Cost Estimation Expense", {
  cost_estimation_expense_add: function (frm, cdt, cdn) {
    if (frm.doc.quotation_items.length === 1) {
      let selling_table = frm.doc.quotation_items[0];
      set_selling_item_values(cdt, cdn, selling_table);
    } else if (frm.doc.quotation_items.length > 1) {
      // If there is exactly one item in the quotation_items table
      apply_dynamic_filter(frm, "selling_item", "cost_estimation_expense");
    }

    // Only show items where is_purchase_item is enabled
    frm.fields_dict["cost_estimation_expense"].grid.get_field(
      "item_code"
    ).get_query = function () {
      return {
        filters: {
          is_purchase_item: 1,
        },
      };
    };
  },

  cost_estimation_expense_remove: function (frm, cdt, cdn) {
    update_totals_of_cost_estimation_expense(frm);
  },

  selling_item: function (frm, cdt, cdn) {
    let current_row = locals[cdt][cdn];
    frappe.call({
      method:
        "envision_crm.envision_crm.api.get_data.get_quotation_selling_items_details",
      args: {
        cost_estimation_id: current_row.parent,
        item_name: current_row.selling_item,
      },
      callback: function (r) {
        if (!r.exc) {
          set_selling_item_values(cdt, cdn, r.message);
        }
      },
    });
  },
  item_code: function (frm, cdt, cdn) {
    
    // Get the global checkbox value
    if (frm.doc.enable_salary_rate_sync) {
      // Get the current row in 'cost_estimation_expense'
      let expense_row = frappe.get_doc(cdt, cdn);

      // Find a matching row in 'contract_employee_salary_estimation'
      let operational_row = frm.doc.contract_employee_salary_estimation.find(
        (op_row) => op_row.item_code === expense_row.item_code
      );

      if (operational_row) {
        // Set the 'bare_amount' from the operational table to the 'rate' field
        frappe.model.set_value(cdt, cdn, "rate", operational_row.bare_amount);
      } 
      // else {
      //   // Show a warning if no matching item_code is found
      //   // frappe.msgprint(
      //   //   `No matching item found`,
      //   //   "Warning"
      //   // );
      // }
    }
  
  },

  rate: function (frm, cdt, cdn) {
    calculate_total_cost(frm, cdt, cdn);
  },

  quantity: function (frm, cdt, cdn) {
    calculate_total_cost(frm, cdt, cdn);
  },

  unloading_percentage: function (frm, cdt, cdn) {
    handle_percentage_changes(frm, cdt, cdn);
  },

  transportation_percentage: function (frm, cdt, cdn) {
    handle_percentage_changes(frm, cdt, cdn);
  },

  erection_percentage: function (frm, cdt, cdn) {
    handle_percentage_changes(frm, cdt, cdn);
   
  },
  

  total_amount_with_erection: function (frm, cdt, cdn) {
    
  },

 
});

// Function for setting selling item values
function set_selling_item_values(cdt, cdn, data) {
  frappe.model.set_value(cdt, cdn, {
    selling_item: data.item_code || "",
    unloading_percentage: data.unloading_percentage || 0,
    transportation_percentage: data.transportation_percentage || 0,
    erection_percentage: data.erection_percentage || 0,
  });
}

// Function to calculate total cost
function calculate_total_cost(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let amount_value = (current_row.quantity || 0) * (current_row.rate || 0);

  frappe.model.set_value(cdt, cdn, "amount", amount_value);

  // Recalculate percentages and totals
  handle_percentage_changes(frm, cdt, cdn);
}

// Function to handle changes in percentages (unloading, transportation, erection)
function handle_percentage_changes(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];

  let unloading_amount = calculate_percentage_amount(
    current_row.amount,
    current_row.unloading_percentage
  );
  let transportation_amount = calculate_percentage_amount(
    current_row.amount,
    current_row.transportation_percentage
  );
  let erection_amount = calculate_percentage_amount(
    current_row.amount,
    current_row.erection_percentage
  );

  frappe.model.set_value(cdt, cdn, {
    unloading_amount: unloading_amount,
    transportation_amount: transportation_amount,
    erection_amount: erection_amount,
  });

  
  update_total_bare_amount(frm, cdt, cdn);

  update_totals_of_cost_estimation_expense(frm);
}

// Function to calculate a percentage-based amount
function calculate_percentage_amount(amount, percentage) {
  return ((amount || 0) * (percentage || 0)) / 100;
}

// Function to update total Landed/ Bare amount
function update_total_bare_amount(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let total_amount_with_erection = 0;

  total_amount_with_erection =
    (current_row.amount || 0) +
    (current_row.unloading_amount || 0) +
    (current_row.transportation_amount || 0) +
    (current_row.erection_amount || 0);

  frappe.model.set_value(
    cdt,
    cdn,
    "total_amount_with_erection",
    Math.round(total_amount_with_erection)
  );
  frm.refresh_fields("total_amount_with_erection");
}

// Function to update the overall totals
function update_totals_of_cost_estimation_expense(frm) {
  let total_amount = 0,
    total_bare_amount = 0,
    total_unloading = 0,
    total_transport = 0,
    total_installation = 0;


  frm.doc.cost_estimation_expense.forEach((row) => {
    total_amount += row.amount || 0;
    total_bare_amount += row.total_amount_with_erection || 0;
    total_unloading += row.unloading_amount || 0;
    total_transport += row.transportation_amount || 0;
    total_installation += row.erection_amount || 0;
  });

  frm.set_value({
    total_amount: Math.round(total_amount),
    total_erection_amount: Math.round(total_bare_amount),
    total_unloading: Math.round(total_unloading),
    total_transport: Math.round(total_transport),
    total_installation: Math.round(total_installation),

  });

  frm.refresh_fields([
    "total_amount",
    "total_erection_amount",
    "total_unloading",
    "total_transport",
    "total_installation",
  ]);
}


// Selling item wise amount calculation 
function calculate_selling_item_wise_amounts(
  frm,
  child_table,
  total_amount_field,
  parent_table,
  target_field
) {
  // Initialize an object to store the sum of total_amount for each selling_item
  let selling_item_wise_total_amounts = {};

  // Iterate over each row in the child_table to calculate totals for each selling_item
  frm.doc[child_table].forEach((row) => {
    let selling_item = row.selling_item;

    // If the selling_item doesn't exist in the object, initialize it
    if (!selling_item_wise_total_amounts[selling_item]) {
      selling_item_wise_total_amounts[selling_item] = 0;
    }

    // Add the total_amount for this row to the corresponding selling_item key
    selling_item_wise_total_amounts[selling_item] +=
      row[total_amount_field] || 0;
  });

  // Iterate over each row in the parent_table to update the target_field
  frm.doc[parent_table].forEach((row) => {
    let item_code = row.item_code;

    // If the item exists in the selling_item_wise_total_amounts object
    if (selling_item_wise_total_amounts[item_code]) {
      // Set the total amount for the corresponding item
      frappe.model.set_value(
        row.doctype,
        row.name,
        target_field,
        Math.round(selling_item_wise_total_amounts[item_code])
      );
    } else {
      // If the item was removed from the child_table, reset the target field to 0
      frappe.model.set_value(row.doctype, row.name, target_field, 0);
    }
  });

  // Refresh the quotation_items table after the updates
  frm.refresh_field(parent_table);
}

// Cost Estimation For Operational Department
frappe.ui.form.on("Contract Employee Salary Estimation", {
  
  minimum_wages: function (frm, cdt, cdn) {
    handle_cost_calculations(frm, cdt, cdn);
  },

  working_days: function (frm, cdt, cdn) {
    handle_cost_calculations(frm, cdt, cdn);
  },

  epf_percentage: function (frm, cdt, cdn) {
    handle_cost_calculations(frm, cdt, cdn);
  },

  monthly_salary: function (frm, cdt, cdn) {
    handle_cost_calculations(frm, cdt, cdn);
    // calculate_leave(frm, cdt, cdn);
    // calculate_over_time_and_public_holiday(frm, cdt, cdn);
  },

  bonus_percentage: function (frm, cdt, cdn) {
    handle_cost_calculations(frm, cdt, cdn);

    handle_cost_calculations(frm, cdt, cdn);
  },
  working_days: function (frm, cdt, cdn) {
    handle_cost_calculations(frm, cdt, cdn);

    calculate_leave(frm, cdt, cdn);
    calculate_over_time_and_public_holiday(frm, cdt, cdn);
  },
  leave_per_month: function (frm, cdt, cdn) {
    handle_cost_calculations(frm, cdt, cdn);

    // calculate_leave(frm, cdt, cdn);
  },
  ot_and_public_holiday_per_month: function (frm, cdt, cdn) {
    handle_cost_calculations(frm, cdt, cdn);

    // calculate_over_time_and_public_holiday(frm, cdt, cdn);
  },
  gratuity: function(frm, cdt, cdn) {
    handle_cost_calculations(frm, cdt, cdn);
  },

});

// Function to handle total cost calculations
function handle_cost_calculations(frm, cdt, cdn) {
  calculate_total_minimum_wage(frm, cdt, cdn);
  calculate_bare_amount(frm, cdt, cdn);
}

function calculate_total_minimum_wage(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let minimum_wages = current_row.minimum_wages || 0;
  let working_days = current_row.working_days || 0;
  let total_minimum_wage = 0;
  total_minimum_wage = minimum_wages * working_days;

  frappe.model.set_value(
    cdt,
    cdn,
    "total_minimum_wage",
    Math.round(total_minimum_wage)
  );

  calculate_epf_amount(frm, cdt, cdn);
  calculate_allowance_amount(frm, cdt, cdn);
  calculate_bonus_amount(frm, cdt, cdn);
  calculate_leave(frm, cdt, cdn);
  calculate_over_time_and_public_holiday(frm, cdt, cdn);
  calculate_gratuity(frm, cdt, cdn);
}

function calculate_epf_amount(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let total_minimum_wage = current_row.total_minimum_wage || 0;
  let epf_percentage = current_row.epf_percentage || 0;
  let epf_amount = (total_minimum_wage * epf_percentage) / 100;

  frappe.model.set_value(cdt, cdn, "epf_amount", Math.round(epf_amount));

  calculate_allowance_amount(frm, cdt, cdn);
}

function calculate_allowance_amount(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let monthly_salary = current_row.monthly_salary || 0;
  let total_minimum_wage = current_row.total_minimum_wage || 0;
  let epf_amount = current_row.epf_amount || 0;

  let allowance_amount = monthly_salary - total_minimum_wage - epf_amount;
  frappe.model.set_value(
    cdt,
    cdn,
    "allowance_amount",
    Math.round(allowance_amount)
  );
}

function calculate_bonus_amount(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let total_minimum_wage = current_row.total_minimum_wage || 0;
  let bonus_percentage = current_row.bonus_percentage || 0;
  let bonus_amount = (total_minimum_wage * bonus_percentage) / 100;

  frappe.model.set_value(cdt, cdn, "bonus_amount", Math.round(bonus_amount));
}

// Function to calculate leave
function calculate_leave(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let monthly_salary = current_row.monthly_salary || 0;
  let working_days = current_row.working_days || 1;
  let leave_per_month = current_row.leave_per_month || 1.8;
  let leave = 0;

  leave = (monthly_salary / working_days) * leave_per_month;

  frappe.model.set_value(cdt, cdn, "leave", Math.round(leave));
}

function calculate_gratuity(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let gratuity = current_row.gratuity || 0;
  let total_minimum_wage = current_row.total_minimum_wage || 0;
  
  let gratuity_amount = 0;

  gratuity_amount = (total_minimum_wage * gratuity) / 100;

  frappe.model.set_value(
    cdt,
    cdn,
    "gratuity_amount",
    Math.round(gratuity_amount)
  );
}

// Function to calculate overtime and public holiday
function calculate_over_time_and_public_holiday(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let monthly_salary = current_row.monthly_salary || 0;
  let working_days = current_row.working_days || 1;
  let ot_and_public_holiday_per_month =
    current_row.ot_and_public_holiday_per_month || 1;
  let over_time_and_public_holiday = 0;

  over_time_and_public_holiday =
    (monthly_salary / working_days) * ot_and_public_holiday_per_month;

  frappe.model.set_value(
    cdt,
    cdn,
    "over_time_and_public_holiday",
    Math.round(over_time_and_public_holiday)
  );
}

function calculate_bare_amount(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let bare_amount = 0;

  bare_amount =
    (current_row.total_minimum_wage || 0) +
    (current_row.epf_amount || 0) +
    (current_row.allowance_amount || 0) +
    (current_row.bonus_amount || 0) +
    (current_row.leave || 0) +
    (current_row.over_time_and_public_holiday || 0) +
    (current_row.gratuity_amount || 0);

  frappe.model.set_value(cdt, cdn, "bare_amount", Math.round(bare_amount));
  // console.log(bare_amount);

}


// Man Days Section Calculation Start 

// Global variable to store per_day_hour
let per_day_hour = null;

// Function to get default per hour once and store in the global variable
function get_default_per_hour(callback) {
  if (per_day_hour === null) {
    frappe.call({
      method: "envision_crm.envision_crm.api.get_data.get_man_days_hours",
      callback: function (r) {
        if (!r.exc) {
          // Store the result in the global variable
          per_day_hour = r.message.per_day_hours;
          //  console.log("Fetched and stored Per Day Hour:", per_day_hour);

          // Execute callback once data is fetched
          if (callback) callback();
        }
      },
    });
  } else {

    // Execute callback immediately if data is already fetched
    if (callback) callback();
  }
}

// Convert days into hours using per_day_hour
function convert_days_into_hours(days) {
  // Ensure that per_day_hour is available before using it
  if (per_day_hour === null) {
    // Return a default value or an error if per_day_hour is not yet fetched
    console.error("Per Day Hour not available. Fetching now...");
    return days * 8;
  }

  // Use fetched per_day_hour value
  return days * per_day_hour;
}

// Global variable to store level-wise per-hour amounts
let level_wise_per_hour_amounts = null;

// Function to get level wise per hour amount only once
function get_level_wise_per_hour_amount(callback) {
  if (level_wise_per_hour_amounts === null) {
    frappe.call({
      method: "envision_crm.envision_crm.api.get_data.get_level_wise_amount",
      callback: function (r) {
        if (!r.exc) {
          // Store the level wise amount list in the global variable
          level_wise_per_hour_amounts = r.message;

          // Execute callback once data is fetched
          if (callback) callback();
        }
      },
    });
  } else {

    // Execute callback immediately if data is already fetched
    if (callback) callback();
  }
}

// Function to calculate and set amounts based on hours for different levels
function calculate_level_wise_amounts(frm, cdt, cdn) {
  // Fetch level-wise rates first
  get_level_wise_per_hour_amount(function () {
    // Get the current row
    let current_row = locals[cdt][cdn];

    // Initialize total amount
    let total_amount = 0;

    for (let i = 1; i <= 6; i++) {
      // Get hours for the current level (default to 0 if not set)
      let hours = current_row[`level_${i}_hours`] || 0;

      // Get the per-hour rate for the current level
      let level_data = level_wise_per_hour_amounts.find((l) => l.idx === i);
      let rate = level_data?.amount || 0;

      // Calculate amount for this level
      let amount = rate * hours;

      // Add to total amount
      total_amount += amount;

      // Set the calculated amount for this level in the row
      frappe.model.set_value(cdt, cdn, `level_${i}_amount`, amount);
    }

    // Set the total amount in the row
    frappe.model.set_value(cdt, cdn, "total_amount", total_amount);
  });
}

// Handle day changes and calculate hours using the fetched per_day_hour
function handle_days_change(frm, cdt, cdn, day_field, hour_field) {
  get_default_per_hour(function () {
    try {
      let current_row = locals[cdt][cdn];
      let days = current_row[day_field] || 0;
      let hours = convert_days_into_hours(days);

      frappe.model.set_value(cdt, cdn, hour_field, Math.round(hours));
      total_hours(frm, cdt, cdn); // Recalculate total hours
    } catch (error) {
      console.error(`Error updating ${day_field} to ${hour_field}:`, error);
    }
  });
}

// Calculate total hours based on all levels
function total_hours(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];

  let total_hours = [
    current_row.level_1_hours || 0,
    current_row.level_2_hours || 0,
    current_row.level_3_hours || 0,
    current_row.level_4_hours || 0,
    current_row.level_5_hours || 0,
    current_row.level_6_hours || 0,
  ].reduce((temp, hours) => temp + hours, 0);

  //  console.log("Total hours:", total_hours);

  frappe.model.set_value(cdt, cdn, "total_hours", Math.round(total_hours));
}

// Handle hour changes
function handle_hours_change(frm, cdt, cdn, hour_field) {
  try {
    total_hours(frm, cdt, cdn);
    //  console.log(`Updated ${hour_field}`);
  } catch (error) {
    console.error(`Error updating ${hour_field}:`, error);
  }
}

// Event handling for Man Days calculations
frappe.ui.form.on("Man Days", {
  man_days_remove: function (frm, cdt, cdn) {
    update_total_man_days_amount(frm);
  },

  man_days_add: function (frm, cdt, cdn) {
    if (frm.doc.quotation_items.length === 1) {
      set_item_for_single_selling_item(frm, cdt, cdn, "selling_item");
    } else if (frm.doc.quotation_items.length > 1) {
      // If there is exactly one item in the quotation_items table
      apply_dynamic_filter(frm, "selling_item", "man_days");
    }
  },

  level_1_days: function (frm, cdt, cdn) {
    handle_days_change(frm, cdt, cdn, "level_1_days", "level_1_hours");
    update_total_man_days(frm);
  },

  level_2_days: function (frm, cdt, cdn) {
    handle_days_change(frm, cdt, cdn, "level_2_days", "level_2_hours");
    update_total_man_days(frm);
  },

  level_3_days: function (frm, cdt, cdn) {
    handle_days_change(frm, cdt, cdn, "level_3_days", "level_3_hours");
    update_total_man_days(frm);
  },

  level_4_days: function (frm, cdt, cdn) {
    handle_days_change(frm, cdt, cdn, "level_4_days", "level_4_hours");
    update_total_man_days(frm);
  },
  level_5_days: function (frm, cdt, cdn) {
    handle_days_change(frm, cdt, cdn, "level_5_days", "level_5_hours");
    update_total_man_days(frm);
  },
  level_6_days: function (frm, cdt, cdn) {
    handle_days_change(frm, cdt, cdn, "level_6_days", "level_6_hours");
    update_total_man_days(frm);
  },

  level_1_hours: function (frm, cdt, cdn) {
    handle_hours_change(frm, cdt, cdn, "level_1_hours");
    calculate_level_wise_amounts(frm, cdt, cdn);
  },

  level_2_hours: function (frm, cdt, cdn) {
    handle_hours_change(frm, cdt, cdn, "level_2_hours");
    calculate_level_wise_amounts(frm, cdt, cdn);
  },

  level_3_hours: function (frm, cdt, cdn) {
    handle_hours_change(frm, cdt, cdn, "level_3_hours");
    calculate_level_wise_amounts(frm, cdt, cdn);
  },

  level_4_hours: function (frm, cdt, cdn) {
    handle_hours_change(frm, cdt, cdn, "level_4_hours");
    calculate_level_wise_amounts(frm, cdt, cdn);
  },

  level_5_hours: function (frm, cdt, cdn) {
    handle_hours_change(frm, cdt, cdn, "level_5_hours");
    calculate_level_wise_amounts(frm, cdt, cdn);
  },

  level_6_hours: function (frm, cdt, cdn) {
    handle_hours_change(frm, cdt, cdn, "level_6_hours");
    calculate_level_wise_amounts(frm, cdt, cdn);
  },
  total_amount: function (frm, cdt, cdn) {
    update_total_man_days_amount(frm);
  },
});

function update_total_man_days_amount(frm) {
  // Update total level wise hours
  update_total_man_days(frm);

  let total_man_days_amount = 0;

  // Iterate over all rows in the child table
  frm.doc.man_days.forEach((row) => {
    total_man_days_amount += row.total_amount || 0;
  });

  // Set the total amounts in the parent form
  frm.set_value("total_man_days_amount", total_man_days_amount);

  // Refresh the fields to reflect the changes
  frm.refresh_field("total_man_days_amount");
}

function update_total_man_days(frm) {
  let total_level_1_days = 0;
  let total_level_2_days = 0;
  let total_level_3_days = 0;
  let total_level_4_days = 0;
  let total_level_5_days = 0;
  let total_level_6_days = 0;

  // Iterate over all rows in the child table
  frm.doc.man_days.forEach((row) => {
    total_level_1_days += row.level_1_days || 0;
    total_level_2_days += row.level_2_days || 0;
    total_level_3_days += row.level_3_days || 0;
    total_level_4_days += row.level_4_days || 0;
    total_level_5_days += row.level_5_days || 0;
    total_level_6_days += row.level_6_days || 0;
  });

  // Set the total amounts in the parent form
  frm.set_value("total_level_1_days", total_level_1_days);
  frm.set_value("total_level_2_days", total_level_2_days);
  frm.set_value("total_level_3_days", total_level_3_days);
  frm.set_value("total_level_4_days", total_level_4_days);
  frm.set_value("total_level_5_days", total_level_5_days);
  frm.set_value("total_level_6_days", total_level_6_days);

  // Refresh the fields to reflect the changes
  frm.refresh_field("total_level_1_days");
  frm.refresh_field("total_level_2_days");
  frm.refresh_field("total_level_3_days");
  frm.refresh_field("total_level_4_days");
  frm.refresh_field("total_level_5_days");
  frm.refresh_field("total_level_6_days");
}

// Travle Expense Calculate
frappe.ui.form.on("Other Expense", {
  other_expense_remove: function (frm) {
    calculate_total_other_expense(frm);
  },

  other_expense_add: function (frm, cdt, cdn) {
    if (frm.doc.quotation_items.length === 1) {
      set_item_for_single_selling_item(frm, cdt, cdn, "selling_item");
    } else if (frm.doc.quotation_items.length > 1) {
      // If there is exactly one item in the quotation_items table
      apply_dynamic_filter(frm, "selling_item", "other_expense");
    }
  },

  rate: function (frm, cdt, cdn) {
    calculate_other_expense_amount(frm, cdt, cdn);
    calculate_total_other_expense(frm);
  },
  quantity: function (frm, cdt, cdn) {
    calculate_other_expense_amount(frm, cdt, cdn);
    calculate_total_other_expense(frm);
  },
  days: function (frm, cdt, cdn) {
    calculate_other_expense_amount(frm, cdt, cdn);
    calculate_total_other_expense(frm);
  },

  expense_type: function (frm, cdt, cdn) {
    calculate_other_expense_amount(frm, cdt, cdn);
    calculate_total_other_expense(frm);
  },
});

function calculate_other_expense_amount(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let amount = 0;
  let rate = current_row.rate || 0;
  let days = current_row.days || 1;
  let quantity = current_row.quantity || 1;

  amount = rate * quantity * days;

  // Set the calculated amount for the current row
  frappe.model.set_value(cdt, cdn, "amount", Math.round(amount));
}

function calculate_total_other_expense(frm) {
  let total_other_expense = 0;

  // Iterate over each row in the "Other Expense" child table
  frm.doc.other_expense.forEach((row) => {
    // Sum up the amounts of all rows
    total_other_expense += row.amount || 0;
  });

  // Set the calculated total into the total_other_expense field
  frm.set_value("total_other_expense", Math.round(total_other_expense));

  // Refresh the field to reflect the change
  frm.refresh_field("total_other_expense");
}
