frappe.ui.form.on("Cost Estimation", {
  refresh: function (frm) {
    console.log("Referesh status ", frm.doc.docstatus);
    if (frm.doc.docstatus === 1) {
      frm.add_custom_button("Create Quotation", () => {
        // Asking confirmation message
        frappe.confirm(
          "Are you sure you want to create a Quotation?",
          function () {
            // Frappe call for crewating quotation with common data
            frappe.call({
              method:
                "envision_crm.envision_crm.api.create_quotation.create_quotation",
              args: {
                cost_estimation_id: frm.doc.name,
                opportunity: frm.doc.opportunity,
                company: frm.doc.company,
              },
              callback: function (r) {
                if (!r.exc) {
                  // Set the set_route to quotation form
                  frappe.set_route(
                    "Form",
                    "Quotation",
                    r.message.quotation_name
                  );
                }
              },
            }); // End frappe call
          }
        ); // End Conformation message
      }); // End click button function
    }
  }, // End refresh event

  // if Opportunity change then all fields are reset.
  opportunity: function (frm) {
    frm.clear_table("quotation_items");
    frm.clear_table("projects_department_cost_estimation");
    frm.clear_table("eia_department_cost_estimation");
    frm.clear_table("operational_department_cost_estimation");
    frm.clear_table("man_days");
    frm.set_value("project_template", "");
    frm.set_value("total_amount", 0);
    frm.set_value("total_supply_amount", 0);
    frm.set_value("total_erection_amount", 0);
    frm.set_value("total_technical_amount", 0);
    frm.set_value("total_travelling_amount", 0);
    frm.set_value("total_over_head", 0);
    frm.set_value("total_amount_of_eia", 0);
    frm.set_value("total_expense", 0);
    frm.set_value("total_cost_of_eia", 0);
    frm.set_value("total_bare_amount", 0);
    frm.set_value("total_amount_with_over_head_and_service_charges", 0);
    frm.set_value("total_grand_amount", 0);
    frm.set_value("total_man_days_amount", 0);
    frm.set_value("total_level_1_hours", 0);
    frm.set_value("total_level_2_hours", 0);
    frm.set_value("total_level_3_hours", 0);
    frm.set_value("total_level_4_hours", 0);

    frm.set_value("profit_percentage", 0);
    frm.set_value("profit_amount", 0);
    frm.set_value("total_project_cost", 0);

    // show priority and due_date field
    // if status is Open
    frm.toggle_display(
      [
        "projects_department_cost_estimation",
        "total_amount",
        "total_supply_amount",
        "total_erection_amount",
      ],
      frm.doc.department === frm.doc.department
    );
  },

  project_template: function (frm) {
    frappe.call({
      method:
        "envision_crm.envision_crm.api.get_data.get_project_template_task_list",
      args: {
        Project_template_id: frm.doc.project_template,
      },
      callback: function (r) {
        if (!r.exc) {
          //  console.log(r.message);

          // if Prject Template change then entire man days table reset.
          frm.clear_table("man_days");
          frm.set_value("total_man_days_amount", 0);
           frm.set_value("total_level_1_hours", 0);
           frm.set_value("total_level_2_hours", 0);
           frm.set_value("total_level_3_hours", 0);
           frm.set_value("total_level_4_hours", 0);
          frm.refresh_field("total_man_days_amount");

          let task_mapping = r.message;
          console.log(task_mapping);

          task_mapping.forEach((task) => {
            // Add a new row for each child task
            console.log("Task", task.task);
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
          });

          // Refresh the child table after adding rows
          frm.refresh_field("man_days");
        }
      },
    });
  },

  // if ( "operation " in frm.doc.department )

  // Projects department Profit calculate
  total_erection_amount: function (frm, cdt, cdn) {
    calculate_profit_amount(frm, frm.doc.total_erection_amount);
  },

  // EIA department Profit calculate
  total_cost_of_eia: function (frm, cdt, cdn) {
    calculate_profit_amount(frm, frm.doc.total_cost_of_eia);
  },

  // Operational department Profit calculate
  total_grand_amount: function (frm, cdt, cdn) {
    calculate_profit_amount(frm, frm.doc.total_grand_amount);
  },
});

// Function to calculate profit amount based on department total cost and profit percentage
function calculate_profit_amount(frm, department_total_cost) {
  // Retrieve profit percentage from the form, defaulting to 0 if not present
  let profit_percentage = frm.doc.profit_percentage || 0;
  let profit_amount = 0;
  let total_project_cost = 0;

  // Ensure department_total_cost is valid and default to 0 if not
  department_total_cost = department_total_cost || 0;

  // Log the values for debugging
  //  console.log("Profit Percentage: ", profit_percentage);
  //  console.log("Department Total Cost: ", department_total_cost);

  // Calculate profit amount using the formula: (department total cost * profit percentage) / 100
  profit_amount = (department_total_cost * profit_percentage) / 100;
  total_project_cost = department_total_cost + profit_amount;

  // Log the calculated profit amount
  //  console.log("Calculated Profit Amount: ", profit_amount);

  // Set the calculated profit amount in the form
  frm.set_value("profit_amount", Math.round(profit_amount));
  frm.set_value("total_project_cost", Math.round(total_project_cost));

  // Refresh the field to reflect the new value
  frm.refresh_field("profit_amount");
}

// Project Department Cost Estimation
frappe.ui.form.on("Project Department Cost Estimation", {
  projects_department_cost_estimation_add: function (frm, cdt, cdn) {
    if (frm.doc.quotation_items.length === 1) {
      let selling_table = frm.doc.quotation_items[0];
      set_selling_item_values(cdt, cdn, selling_table);
    }
  },

  projects_department_cost_estimation_remove: function (frm) {
    update_totals(frm);
    parent_item_wise_total_amount(
      frm,
      "projects_department_cost_estimation",
      "total_amount_with_erection",
      "quantity"
    );
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
    parent_item_wise_total_amount(
      frm,
      "total_amount_with_erection",
      "quantity"
    );
  },

  total_amount_with_erection: function (frm, cdt, cdn) {
    parent_item_wise_total_amount(
      frm,
      "projects_department_cost_estimation",
      "total_amount_with_erection",
      "quantity"
    );
  },
});

// Function for setting selling item values
function set_selling_item_values(cdt, cdn, data) {
  frappe.model.set_value(cdt, cdn, {
    selling_item: data.item_code || "",
    unloading_percentage: data.unloading_percentage || 0,
    transportation_percentage: data.transportation_percentage || 0,
    erection_percentage: data.erection_percentage || 0,
    profit_percentage: data.profit_percentage || 0,
  });
}

// Function to calculate total cost
function calculate_total_cost(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let amount_value = (current_row.quantity || 0) * (current_row.rate || 0);

  frappe.model.set_value(cdt, cdn, "amount", amount_value);

  handle_percentage_changes(frm, cdt, cdn); // Recalculate percentages and totals
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

  update_supply_amount(
    cdt,
    cdn,
    unloading_amount,
    transportation_amount,
    current_row.amount
  );
  update_total_amount_with_erection(cdt, cdn, erection_amount);
  update_totals(frm);
}

// Function to calculate a percentage-based amount
function calculate_percentage_amount(amount, percentage) {
  return ((amount || 0) * (percentage || 0)) / 100;
}

// Function to update supply amount
function update_supply_amount(
  cdt,
  cdn,
  unloading_amount,
  transportation_amount,
  amount
) {
  let supply_amount =
    (unloading_amount || 0) + (transportation_amount || 0) + (amount || 0);
  frappe.model.set_value(cdt, cdn, "supply_amount", supply_amount);
}

// Function to update total amount with erection
function update_total_amount_with_erection(cdt, cdn, erection_amount) {
  let current_row = locals[cdt][cdn];
  let total_amount_with_erection =
    (current_row.supply_amount || 0) + (erection_amount || 0);
  frappe.model.set_value(
    cdt,
    cdn,
    "total_amount_with_erection",
    total_amount_with_erection
  );
}

// Function to update the overall totals
function update_totals(frm) {
  let total_amount = 0,
    total_supply_amount = 0,
    total_erection_amount = 0;

  frm.doc.projects_department_cost_estimation.forEach((row) => {
    total_amount += row.amount || 0;
    total_supply_amount += row.supply_amount || 0;
    total_erection_amount += row.total_amount_with_erection || 0;
  });

  frm.set_value({
    total_amount: Math.round(total_amount),
    total_supply_amount: Math.round(total_supply_amount),
    total_erection_amount: Math.round(total_erection_amount),
  });

  frm.refresh_fields([
    "total_amount",
    "total_supply_amount",
    "total_erection_amount",
  ]);
}

// set the rate value  in the sellng table per child item wise.
// function parent_item_wise_total_amount(frm) {
//   // Initialize an object to store the sum of total_amount_with_erection for each selling_item
//   let selling_item_totals = {};

//   // Iterate over each row in the child table
//   frm.doc.projects_department_cost_estimation.forEach((row) => {
//     let selling_item = row.selling_item;

//     // If the selling_item doesn't exist in the object, initialize it
//     if (!selling_item_totals[selling_item]) {
//       selling_item_totals[selling_item] = 0;
//     }

//     // Add the total_amount_with_erection to the corresponding selling_item key
//     selling_item_totals[selling_item] += row.total_amount_with_erection || 0;
//   });
//   console.log("selling_item_totals:", selling_item_totals);

//   // console.log("Selling Item Wise Totals:", selling_item_totals);
//   let selling_item_rate = 0;
//   // console.log(object)

//   frm.doc.quotation_items.forEach((row) => {
//     if (selling_item_totals[row.item_code]) {
//       frappe.model.set_value(
//         row.doctype,
//         row.name,
//         "rate",
//         selling_item_totals[row.item_code]
//       );
//     }
//   });

//   // Refresh the quotation_items table after the updates
//   frm.refresh_field("quotation_items");
// }

function parent_item_wise_total_amount(
  frm,
  child_table,
  total_amount_field,
  qty_field
) {
  // Initialize objects to store the sum of total_amount and total_qty for each selling_item
  let selling_item_totals = {};
  let selling_item_quantities = {};

  // Iterate over each row in the child table (projects_department_cost_estimation)
  frm.doc[child_table].forEach((row) => {
    let selling_item = row.selling_item;

    // If the selling_item doesn't exist in the objects, initialize them
    if (!selling_item_totals[selling_item]) {
      selling_item_totals[selling_item] = 0;
      selling_item_quantities[selling_item] = 0;
    }

    // Add the dynamic total amount field to the corresponding selling_item key
    selling_item_totals[selling_item] += row[total_amount_field] || 0;

    // Add the dynamic quantity field to the corresponding selling_item key
    selling_item_quantities[selling_item] += row[qty_field] || 0;
  });

  console.log("selling_item_totals:", selling_item_totals);
  console.log("selling_item_quantities:", selling_item_quantities);

  // Iterate over each row in the quotation_items table to update rate, quantity, and amount
  frm.doc.quotation_items.forEach((row) => {
    let item_code = row.item_code;

    // If the item exists in the selling_item_totals object
    if (selling_item_totals[item_code]) {
      // Set the rate from the selling_item_totals
      let rate = selling_item_totals[item_code];

      // Get the total quantity for this item
      let total_qty = selling_item_quantities[item_code];

      // Set the quantity and calculate the amount (rate * total quantity)
      let amount = rate * row.quantity;

      // Set the rate, quantity, and amount for the current item row
      frappe.model.set_value(row.doctype, row.name, "rate", Math.round(rate));
      // frappe.model.set_value(row.doctype, row.name, "quantity", total_qty);
      frappe.model.set_value(
        row.doctype,
        row.name,
        "amount",
        Math.round(amount)
      );
    }
  });

  // Refresh the quotation_items table after the updates
  frm.refresh_field("quotation_items");
}

// Cost Estimation For EIA Departrment
frappe.ui.form.on("EIA Department Cost Estimation", {
  // when a new row is added in the cost estimation child table
  eia_department_cost_estimation_add: function (frm, cdt, cdn) {
    set_first_selling_item(frm, cdt, cdn);
  },
  eia_department_cost_estimation_remove: function (frm, cdt, cdn) {
    // update_costs_and_totals(frm, cdt, cdn);
    update_total_values(frm);
    parent_item_wise_total_amount(
      frm,
      "eia_department_cost_estimation",
      "expense",
      "no_of_persons"
    );
  },

  // when amount, no_of_persons, no_of_visit, or technical_amount fields change
  amount: function (frm, cdt, cdn) {
    update_costs_and_totals(frm, cdt, cdn);
  },

  no_of_persons: function (frm, cdt, cdn) {
    update_costs_and_totals(frm, cdt, cdn);
  },

  no_of_visit: function (frm, cdt, cdn) {
    update_costs_and_totals(frm, cdt, cdn);
  },

  technical_amount: function (frm, cdt, cdn) {
    update_costs_and_totals(frm, cdt, cdn);
  },

  // when travelling_amount, expense, or total_cost_of_eia fields change
  travelling_amount: function (frm, cdt, cdn) {
    update_total_values(frm);
  },

  item_type: function (frm, cdt, cdn) {
    update_total_values(frm);
    update_costs_and_totals(frm, cdt, cdn);
  },

  expense: function (frm, cdt, cdn) {
    update_total_values(frm);
    parent_item_wise_total_amount(
      frm,
      "eia_department_cost_estimation",
      "expense",
      "no_of_persons"
    );
  },

  // total_cost_of_eia:function(frm){
  //    parent_item_wise_total_amount(
  //      frm,
  //      "eia_department_cost_estimation",
  //      "expense",
  //      "no_of_persons"
  //    );
  // },
});

// Set the selling item in the first row of the quotation items
function set_first_selling_item(frm, cdt, cdn) {
  if (frm.doc.quotation_items.length === 1) {
    let first_item = frm.doc.quotation_items[0];
    frappe.model.set_value(cdt, cdn, "selling_item", first_item.item_code);
  }
}

// Update the travelling amount and recalculate the totals for the form
function update_costs_and_totals(frm, cdt, cdn) {
  // Calculate travelling amount
  calculate_travelling_amount(frm, cdt, cdn);

  // Update total values for the form
  update_total_values(frm);
}

// Calculate the travelling amount based on number of persons, visits, and amount
function calculate_travelling_amount(frm, cdt, cdn) {
  let row = locals[cdt][cdn];

  // Default values to 0 if missing
  let no_of_persons = row.no_of_persons || 0;
  let no_of_visit = row.no_of_visit || 0;
  let amount = row.amount || 0;

  // Calculate travelling amount
  let travelling_amount = no_of_persons * no_of_visit * amount;
  frappe.model.set_value(cdt, cdn, "travelling_amount", travelling_amount);

  // Calculate expense and overhead
  calculate_expense_and_overhead(frm, cdt, cdn);
}

// Calculate the expense and overhead based on the item type
function calculate_expense_and_overhead(frm, cdt, cdn) {
  let row = locals[cdt][cdn];

  // Default values to 0 if missing
  let technical_amount = row.technical_amount || 0;
  let travelling_amount = row.travelling_amount || 0;

  let expense = 0;
  let over_head = 0;

  if (row.item_type === "Non Expense") {
    expense = travelling_amount;
    over_head = technical_amount;
  } else {
    expense = technical_amount + travelling_amount;
  }

  frappe.model.set_value(cdt, cdn, "expense", expense);
  frappe.model.set_value(cdt, cdn, "over_head", over_head);
}

// Update the total values in the parent form by summing up all rows
function update_total_values(frm) {
  let total_amount_of_eia = 0;
  let total_technical_amount = 0;
  let total_travelling_amount = 0;
  let total_expense = 0;
  let total_over_head = 0;

  // Sum up values from all rows in the child table
  frm.doc.eia_department_cost_estimation.forEach((row) => {
    total_amount_of_eia += row.amount || 0;
    total_technical_amount += row.technical_amount || 0;
    total_travelling_amount += row.travelling_amount || 0;
    total_expense += row.expense || 0;
    total_over_head += row.over_head || 0;
  });

  // Set the calculated total values in the parent form
  frm.set_value("total_amount_of_eia", total_amount_of_eia);
  frm.set_value("total_technical_amount", total_technical_amount);
  frm.set_value("total_travelling_amount", total_travelling_amount);
  frm.set_value("total_expense", total_expense);
  frm.set_value("total_over_head", total_over_head);

  // Calculate total cost of EIA
  let total_cost_of_eia = total_technical_amount + total_travelling_amount;
  frm.set_value("total_cost_of_eia", total_cost_of_eia);

  // Refresh fields
  frm.refresh_fields([
    "total_amount_of_eia",
    "total_technical_amount",
    "total_travelling_amount",
    "total_expense",
    "total_over_head",
    "total_cost_of_eia",
  ]);
}

// Cost Estimation For Operational Department
frappe.ui.form.on("Operational Department Cost Estimation", {
  operational_department_cost_estimation_add: function (frm, cdt, cdn) {
    if (frm.doc.quotation_items.length === 1) {
      let selling_table = frm.doc.quotation_items[0];
      frappe.model.set_value(cdt, cdn, "selling_item", selling_table.item_code);
    }
  },

  operational_department_cost_estimation_remove: function (frm, cdt, cdn) {
    total_amounts_of_operational_department(frm);
    parent_item_wise_total_amount(
      frm,
      "operational_department_cost_estimation",
      "grand_total_amount",
      "quantity"
    );
  },

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
    calculate_leave(frm, cdt, cdn);
    calculate_over_time_and_public_holiday(frm, cdt, cdn);
  },

  bonus_percentage: function (frm, cdt, cdn) {
    handle_cost_calculations(frm, cdt, cdn);
  },

  safety_item: function (frm, cdt, cdn) {
    handle_cost_calculations(frm, cdt, cdn);
  },

  wc_policy: function (frm, cdt, cdn) {
    handle_cost_calculations(frm, cdt, cdn);
  },

  over_head_amount: function (frm, cdt, cdn) {
    calculate_total_amount(frm, cdt, cdn);
  },

  service_charges_amount: function (frm, cdt, cdn) {
    calculate_total_amount(frm, cdt, cdn);
  },

  quantity: function (frm, cdt, cdn) {
    calculate_grand_total_amount(frm, cdt, cdn);
  },

  bare_amount: function (frm, cdt, cdn) {
    total_amounts_of_operational_department(frm);
  },

  total_amount: function (frm, cdt, cdn) {
    total_amounts_of_operational_department(frm);
  },

  grand_total_amount: function (frm, cdt, cdn) {
    total_amounts_of_operational_department(frm);
    parent_item_wise_total_amount(
      frm,
      "operational_department_cost_estimation",
      "grand_total_amount",
      "quantity"
    );
  },

  // grand_total_amount: function (frm, cdt, cdn) {
  //   parent_item_wise_total_amount(
  //     frm,
  //     "operational_department_cost_estimation",
  //     "grand_total_amount",
  //     "quantity"
  //   );
  // },
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
  let total_minimum_wage = minimum_wages * working_days;

  frappe.model.set_value(
    cdt,
    cdn,
    "total_minimum_wage",
    Math.round(total_minimum_wage)
  );

  calculate_epf_amount(frm, cdt, cdn);
  calculate_allowance_amount(frm, cdt, cdn);
  calculate_bonus_amount(frm, cdt, cdn);
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
  let leave = (monthly_salary / 26) * 1.8;

  frappe.model.set_value(cdt, cdn, "leave", Math.round(leave));
}

// Function to calculate overtime and public holiday
function calculate_over_time_and_public_holiday(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let monthly_salary = current_row.monthly_salary || 0;
  let over_time_and_public_holiday = (monthly_salary / 26) * 1;

  frappe.model.set_value(
    cdt,
    cdn,
    "over_time_and_public_holiday",
    Math.round(over_time_and_public_holiday)
  );
}

function calculate_bare_amount(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let profit_percentage = current_row.profit_percentage || 0;
  let service_charges_amount = current_row.service_charges_amount || 0;

  let bare_amount =
    (current_row.total_minimum_wage || 0) +
    (current_row.epf_amount || 0) +
    (current_row.allowance_amount || 0) +
    (current_row.bonus_amount || 0) +
    (current_row.leave || 0) +
    (current_row.over_time_and_public_holiday || 0) +
    (current_row.safety_item || 0) +
    (current_row.gratuity || 0) +
    (current_row.wc_policy || 0);

  frappe.model.set_value(cdt, cdn, "bare_amount", Math.round(bare_amount));

  service_charges_amount = (bare_amount * profit_percentage) / 100;
  frappe.model.set_value(
    cdt,
    cdn,
    "service_charges_amount",
    Math.round(service_charges_amount)
  );

  calculate_total_amount(frm, cdt, cdn);
}

function calculate_total_amount(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let total_amount =
    (current_row.bare_amount || 0) +
    (current_row.over_head_amount || 0) +
    (current_row.service_charges_amount || 0);

  frappe.model.set_value(cdt, cdn, "total_amount", Math.round(total_amount));

  calculate_grand_total_amount(frm, cdt, cdn);
}

function calculate_grand_total_amount(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let total_amount = current_row.total_amount || 0;
  let quantity = current_row.quantity || 0;

  let grand_total_amount = total_amount * quantity;

  frappe.model.set_value(
    cdt,
    cdn,
    "grand_total_amount",
    Math.round(grand_total_amount)
  );
}

function total_amounts_of_operational_department(frm) {
  let total_bare_amount = 0;
  let total_amount_with_over_head_and_service_charges = 0;
  let total_grand_amount = 0;

  // Iterate over all rows in the child table
  frm.doc.operational_department_cost_estimation.forEach((row) => {
    total_bare_amount += row.bare_amount || 0;
    total_amount_with_over_head_and_service_charges += row.total_amount || 0;
    total_grand_amount += row.grand_total_amount || 0;
  });

  // Set the total amounts in the parent form
  frm.set_value("total_bare_amount", total_bare_amount);
  frm.set_value(
    "total_amount_with_over_head_and_service_charges",
    total_amount_with_over_head_and_service_charges
  );
  frm.set_value("total_grand_amount", total_grand_amount);

  // Refresh the fields to reflect the changes
  frm.refresh_field("total_bare_amount");
  frm.refresh_field("total_amount_with_over_head_and_service_charges");
  frm.refresh_field("total_grand_amount");
}

// Man Days Calculation

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
    //  console.log("Using cached Per Day Hour:", per_day_hour);

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
    return days * 8; // Default fallback to 8 if per_day_hour is not yet available
  }

  return days * per_day_hour; // Use fetched per_day_hour value
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
          console.log(
            "Fetched and stored level-wise amounts:",
            level_wise_per_hour_amounts
          );

          // Execute callback once data is fetched
          if (callback) callback();
        }
      },
    });
  } else {
    console.log(
      "Using cached level-wise amounts:",
      level_wise_per_hour_amounts
    );

    // Execute callback immediately if data is already fetched
    if (callback) callback();
  }
}

// Function to calculate amounts based on hours
function calculate_level_wise_amounts(frm, cdt, cdn) {
  // Ensure that the level-wise amounts are fetched first
  get_level_wise_per_hour_amount(function () {
    let current_row = locals[cdt][cdn];

    // Get hours for each level
    let level_1_hours = current_row.level_1_hours || 0;
    let level_2_hours = current_row.level_2_hours || 0;
    let level_3_hours = current_row.level_3_hours || 0;
    let level_4_hours = current_row.level_4_hours || 0;

    // Get per-hour amounts for each level from the fetched data
    // let level_1_amount =
    //   level_wise_per_hour_amounts.find((l) => l.level === "Level 1").amount *
    //   level_1_hours;
    // let level_2_amount =
    //   level_wise_per_hour_amounts.find((l) => l.level === "Level 2").amount *
    //   level_2_hours;
    // let level_3_amount =
    //   level_wise_per_hour_amounts.find((l) => l.level === "Level 3").amount *
    //   level_3_hours;
    // let level_4_amount =
    //   level_wise_per_hour_amounts.find((l) => l.level === "Level 4").amount *
    //   level_4_hours;

    let level_1_amount =
      level_wise_per_hour_amounts.find((l) => l.idx === 1).amount *
      level_1_hours;
    let level_2_amount =
      level_wise_per_hour_amounts.find((l) => l.idx === 2).amount *
      level_2_hours;
    let level_3_amount =
      level_wise_per_hour_amounts.find((l) => l.idx === 3).amount *
      level_3_hours;
    let level_4_amount =
      level_wise_per_hour_amounts.find((l) => l.idx === 4).amount *
      level_4_hours;

    // Calculate total amount
    let total_amount =
      level_1_amount + level_2_amount + level_3_amount + level_4_amount;

    // Set the calculated amounts in the respective fields
    frappe.model.set_value(cdt, cdn, "level_1_amount", level_1_amount);
    frappe.model.set_value(cdt, cdn, "level_2_amount", level_2_amount);
    frappe.model.set_value(cdt, cdn, "level_3_amount", level_3_amount);
    frappe.model.set_value(cdt, cdn, "level_4_amount", level_4_amount);
    frappe.model.set_value(cdt, cdn, "total_amount", total_amount);

    console.log("Level-wise amounts calculated and set:", {
      level_1_amount,
      level_2_amount,
      level_3_amount,
      level_4_amount,
      total_amount,
    });
  });
}

// Handle day changes and calculate hours using the fetched per_day_hour
function handle_days_change(frm, cdt, cdn, day_field, hour_field) {
  get_default_per_hour(function () {
    try {
      let current_row = locals[cdt][cdn];
      let days = current_row[day_field] || 0;
      let hours = convert_days_into_hours(days); // Use per_day_hour in conversion

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
  ].reduce((temp, hours) => temp + hours, 0);

  //  console.log("Total hours:", total_hours);

  frappe.model.set_value(cdt, cdn, "total_hours", Math.round(total_hours));
}

// Handle hour changes
function handle_hours_change(frm, cdt, cdn, hour_field) {
  try {
    total_hours(frm, cdt, cdn); // Update total hours
    //  console.log(`Updated ${hour_field}`);
  } catch (error) {
    console.error(`Error updating ${hour_field}:`, error);
  }
}

// Event handling for Man Days calculations
frappe.ui.form.on("Man Days", {
  man_days_remove: function (frm, cdt, cdn) {
    // if (frm.doc.quotation_items.length >= 1) {
    update_total_man_days_amount(frm);
    //  console.log(" man ok");
    // frappe.model.set_value(cdt, cdn, "selling_item", selling_table.item_code);
    // }
  },

  level_1_days: function (frm, cdt, cdn) {
    handle_days_change(frm, cdt, cdn, "level_1_days", "level_1_hours");
  },

  level_2_days: function (frm, cdt, cdn) {
    handle_days_change(frm, cdt, cdn, "level_2_days", "level_2_hours");
  },

  level_3_days: function (frm, cdt, cdn) {
    handle_days_change(frm, cdt, cdn, "level_3_days", "level_3_hours");
  },

  level_4_days: function (frm, cdt, cdn) {
    handle_days_change(frm, cdt, cdn, "level_4_days", "level_4_hours");
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
  total_amount: function (frm, cdt, cdn) {
    update_total_man_days_amount(frm);
  },
});

function update_total_man_days_amount(frm) {
  // Update total level wise hours
  update_total_man_days_hours(frm);

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

function update_total_man_days_hours(frm) {
  let total_level_1_hours = 0;
  let total_level_2_hours = 0;
  let total_level_3_hours = 0;
  let total_level_4_hours = 0;

  // Iterate over all rows in the child table
  frm.doc.man_days.forEach((row) => {
    total_level_1_hours += row.level_1_hours || 0;
    total_level_2_hours += row.level_2_hours || 0;
    total_level_3_hours += row.level_3_hours || 0;
    total_level_4_hours += row.level_4_hours || 0;
  });

  // Set the total amounts in the parent form
  frm.set_value("total_level_1_hours", total_level_1_hours);
  frm.set_value("total_level_2_hours", total_level_2_hours);
  frm.set_value("total_level_3_hours", total_level_3_hours);
  frm.set_value("total_level_4_hours", total_level_4_hours);

  // Refresh the fields to reflect the changes
  frm.refresh_field("total_level_1_hours");
  frm.refresh_field("total_level_2_hours");
  frm.refresh_field("total_level_3_hours");
  frm.refresh_field("total_level_4_hours");
}

// Travle Expense Calculate
frappe.ui.form.on("Other Expense", {
  other_expense_remove: function (frm) {
    calculate_total_other_expense(frm);
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
  let days = current_row.days || 0;
  let quantity = current_row.quantity || 0;

  if (current_row.expense_type === "Travel") {
    amount = rate * quantity;
  } else if (current_row.expense_type === "Food") {
    amount = rate * quantity * days;
  } else {
    amount = rate;
  }

  // Set the calculated amount for the current row
  frappe.model.set_value(cdt, cdn, "amount", Math.round(amount));
}

function calculate_total_other_expense(frm) {
  let total_other_expense = 0;

  // Iterate over each row in the "Other Expense" child table
  frm.doc.other_expense.forEach((row) => {
    total_other_expense += row.amount || 0; // Sum up the amounts of all rows
  });

  // Set the calculated total into the total_other_expense field
  frm.set_value("total_other_expense", Math.round(total_other_expense));

  // Refresh the field to reflect the change
  frm.refresh_field("total_other_expense");
}
