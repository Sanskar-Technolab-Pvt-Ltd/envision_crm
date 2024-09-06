frappe.ui.form.on("Cost Estimation", {
  project_template: function (frm) {
    frappe.call({
      method:
        "envision_crm.envision_crm.api.get_data.get_project_template_task_list",
      args: {
        Project_template_id: frm.doc.project_template,
      },
      callback: function (r) {
        if (!r.exc) {
          console.log(r.message);
          

          // let row = frm.add_child("man_days_amount", {
          //   activities: "Admin",
          // });

             let task_mapping = r.message;

             // Iterate over the parent tasks
             for (let parent_task in task_mapping) {
               // Iterate over each child task for the current parent task
               task_mapping[parent_task].forEach((child_task) => {
                 // Add a new row for each child task
                 let row = frm.add_child("man_days_amount");

                 // Set the parent task's subject in the "stages_of_project" field
                 frappe.model.set_value(
                   row.doctype,
                   row.name,
                   "stages_of_project",
                   parent_task
                 );

                 // Set the child task's subject in the "activities" field
                 frappe.model.set_value(
                   row.doctype,
                   row.name,
                   "activities",
                   child_task[1]
                 ); // Assuming child_task[1] is the subject
               });
             }

             // Refresh the child table after adding rows
             frm.refresh_field("man_days_amount");
          


        }
      },
    });

  },
});

frappe.ui.form.on("Project Department Cost Estimation", {
  projects_department_cost_estimation_add: function (frm, cdt, cdn) {
    if (frm.doc.quotation_items.length === 1) {
      let selling_table = frm.doc.quotation_items[0];
      set_selling_item_values(cdt, cdn, selling_table);
    }
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
    set_unloading_amount(cdt, cdn);
    update_supply_amount(frm, cdt, cdn);
    update_total_amount_with_erection(cdt, cdn);
    update_totals(frm);
  },

  transportation_percentage: function (frm, cdt, cdn) {
    set_transportation_amount(cdt, cdn);
    update_supply_amount(frm, cdt, cdn);
    update_total_amount_with_erection(cdt, cdn);
    update_totals(frm);
  },

  erection_percentage: function (frm, cdt, cdn) {
    set_erection_amount(cdt, cdn);
    update_total_amount_with_erection(cdt, cdn);
    update_totals(frm);
  },
});

// Function to set selling item values
function set_selling_item_values(cdt, cdn, data) {
  frappe.model.set_value(cdt, cdn, "selling_item", data.item_code);
  frappe.model.set_value(
    cdt,
    cdn,
    "unloading_percentage",
    data.unloading_percentage
  );
  frappe.model.set_value(
    cdt,
    cdn,
    "transportation_percentage",
    data.transportation_percentage
  );
  frappe.model.set_value(
    cdt,
    cdn,
    "erection_percentage",
    data.erection_percentage
  );
  frappe.model.set_value(cdt, cdn, "profit_percentage", data.profit_percentage);
}

// Function to calculate total cost
function calculate_total_cost(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let amount_value = current_row.quantity * current_row.rate;
  frappe.model.set_value(cdt, cdn, "amount", amount_value);

  set_unloading_amount(cdt, cdn);
  set_transportation_amount(cdt, cdn);
  set_erection_amount(cdt, cdn);

  update_supply_amount(frm, cdt, cdn);
  update_total_amount_with_erection(cdt, cdn);
  update_totals(frm);
}

// Function to set unloading amount
function set_unloading_amount(cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let unloading_amount =
    (current_row.amount * current_row.unloading_percentage) / 100;
  frappe.model.set_value(cdt, cdn, "unloading_amount", unloading_amount);
}

// Function to set transportation amount
function set_transportation_amount(cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let transportation_amount =
    (current_row.amount * current_row.transportation_percentage) / 100;
  frappe.model.set_value(
    cdt,
    cdn,
    "transportation_amount",
    transportation_amount
  );
}

// Function to set erection amount
function set_erection_amount(cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let erection_amount =
    (current_row.amount * current_row.erection_percentage) / 100;
  frappe.model.set_value(cdt, cdn, "erection_amount", erection_amount);
}

// Function to update supply amount
function update_supply_amount(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let supply_amount =
    current_row.unloading_amount +
    current_row.transportation_amount +
    current_row.amount;
  frappe.model.set_value(cdt, cdn, "supply_amount", supply_amount);
}

// Function to update total amount with erection
function update_total_amount_with_erection(cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let total_amount_with_erection =
    current_row.supply_amount + current_row.erection_amount;
  frappe.model.set_value(
    cdt,
    cdn,
    "total_amount_with_erection",
    total_amount_with_erection
  );
}

// Function to update totals (total_amount and total_supply_amount)
function update_totals(frm) {
  let total_amount = 0;
  let total_supply_amount = 0;
  let total_erection_amount = 0;

  // Iterate over all rows in the child table
  frm.doc.projects_department_cost_estimation.forEach((row) => {
    total_amount += row.amount || 0;
    total_supply_amount += row.supply_amount || 0;
    total_erection_amount += row.total_amount_with_erection || 0;
  });

  // Set the total amounts in the parent form
  frm.set_value("total_amount", total_amount);
  frm.set_value("total_supply_amount", total_supply_amount);
  frm.set_value("total_erection_amount", total_erection_amount);

  // Refresh the fields to reflect the changes
  frm.refresh_field("total_amount");
  frm.refresh_field("total_supply_amount");
  frm.refresh_field("total_erection_amount");
}

// Cost EStimation For EIA Departrment
frappe.ui.form.on("EIA Department Cost Estimation", {
  eia_department_cost_estimation_add: function (frm, cdt, cdn) {
    if (frm.doc.quotation_items.length === 1) {
      let selling_table = frm.doc.quotation_items[0];
      // console.log("selling table ", selling_table.item_code);
      frappe.model.set_value(cdt, cdn, "selling_item", selling_table.item_code);
    }
  },

  amount: function (frm, cdt, cdn) {
    update_travelling_amount(frm, cdt, cdn);
    update_totals_amount(frm);
  },

  no_of_persons: function (frm, cdt, cdn) {
    update_travelling_amount(frm, cdt, cdn);
    update_totals_amount(frm);
  },

  no_of_visit: function (frm, cdt, cdn) {
    update_travelling_amount(frm, cdt, cdn);
    update_totals_amount(frm);
  },

  technical_amount: function (frm, cdt, cdn) {
    update_travelling_amount(frm, cdt, cdn);
    update_totals_amount(frm);
  },

  amount: function (frm, cdt, cdn) {
    update_travelling_amount(frm, cdt, cdn);
    update_totals_amount(frm);
  },
  travelling_amount: function (frm, cdt, cdn) {
    update_totals_amount(frm);
    let total_expense =
      frm.doc.total_technical_amount + frm.doc.total_travelling_cost;
    console.log("Total travvimng ", frm.doc.total_travelling_cost);
    frm.set_value("total_expense", total_expense);
  },

  expense: function (frm, cdt, cdn) {
    update_totals_amount(frm);
  },
});

function update_travelling_amount(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let travelling_amount =
    current_row.no_of_persons * current_row.no_of_visit * current_row.amount;
  frappe.model.set_value(cdt, cdn, "travelling_amount", travelling_amount);

  update_expense(frm, cdt, cdn);
}

function update_expense(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let expense = current_row.technical_amount + current_row.travelling_amount;
  frappe.model.set_value(cdt, cdn, "expense", expense);
}

function update_totals_amount(frm) {
  let total_amount_of_eia = 0;
  let total_technical_amount = 0;
  let total_travelling_cost = 0;
  let total_expense = 0;

  // Iterate over all rows in the child table
  frm.doc.eia_department_cost_estimation.forEach((row) => {
    total_amount_of_eia += row.amount || 0;
    total_technical_amount += row.technical_amount || 0;
    total_travelling_cost += row.travelling_amount || 0;
    total_expense += row.expense || 0;
  });

  // Set the total amounts in the parent form
  frm.set_value("total_amount_of_eia", total_amount_of_eia);
  frm.set_value("total_technical_amount", total_technical_amount);
  frm.set_value("total_travelling_cost", total_travelling_cost);
  frm.set_value("total_expense", total_expense);

  // Refresh the fields to reflect the changes
  frm.refresh_field("total_amount_of_eia");
  frm.refresh_field("total_technical_amount");
  frm.refresh_field("total_travelling_cost");
  frm.refresh_field("total_expense");
}

// Cost EStimation For Operational Departrment
frappe.ui.form.on("Operational Department Cost Estimation", {
  operational_department_cost_estimation_add: function (frm, cdt, cdn) {
    if (frm.doc.quotation_items.length === 1) {
      let selling_table = frm.doc.quotation_items[0];
      frappe.model.set_value(cdt, cdn, "selling_item", selling_table.item_code);
    }
  },

  minimum_wages: function (frm, cdt, cdn) {
    calculate_total_minimum_wage(frm, cdt, cdn);
    calculate_bare_amount(frm, cdt, cdn);
  },
  working_days: function (frm, cdt, cdn) {
    calculate_total_minimum_wage(frm, cdt, cdn);
    calculate_bare_amount(frm, cdt, cdn);
  },

  epf_percentage: function (frm, cdt, cdn) {
    calculate_epf_amount(frm, cdt, cdn);
    calculate_bare_amount(frm, cdt, cdn);
  },

  monthly_salary: function (frm, cdt, cdn) {
    calculate_allowance_amount(frm, cdt, cdn);
    calculate_leave(frm, cdt, cdn);
    calculate_over_time_and_public_holiday(frm, cdt, cdn);
    calculate_bare_amount(frm, cdt, cdn);
  },

  bonus_percentage: function (frm, cdt, cdn) {
    calculate_bonus_amount(frm, cdt, cdn);
    calculate_bare_amount(frm, cdt, cdn);
  },

  safety_item: function (frm, cdt, cdn) {
    calculate_bare_amount(frm, cdt, cdn);
  },

  wc_policy: function (frm, cdt, cdn) {
    calculate_bare_amount(frm, cdt, cdn);
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
});

function calculate_total_minimum_wage(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let total_minimum_wage = current_row.minimum_wages * current_row.working_days;
  console.log("Wages ", total_minimum_wage);
  console.log("values  ", current_row.minimum_wages, current_row.working_days);

  frappe.model.set_value(
    cdt,
    cdn,
    "total_minimum_wage",
    Math.round(total_minimum_wage)
  );

  // let epf_amount = (current_row.total_minimum_wage * current_row.epf_percentage) / 100;
  // console.log("Wages ", epf_amount);
  // frappe.model.set_value(cdt, cdn, "epf_amount", epf_amount);
  calculate_epf_amount(frm, cdt, cdn);
  calculate_allowance_amount(frm, cdt, cdn);
  calculate_bonus_amount(frm, cdt, cdn);
}

function calculate_epf_amount(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let epf_amount =
    (current_row.total_minimum_wage * current_row.epf_percentage) / 100;
  console.log("EPF", epf_amount);
  // frappe.model.set_value(cdt, cdn, "epf_amount", epf_amount);
  frappe.model.set_value(cdt, cdn, "epf_amount", Math.round(epf_amount));

  calculate_allowance_amount(frm, cdt, cdn);
}

function calculate_allowance_amount(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let allowance_amount =
    current_row.monthly_salary -
    current_row.total_minimum_wage -
    current_row.epf_amount;
  console.log("Allowance Amount", Math.round(allowance_amount));
  frappe.model.set_value(
    cdt,
    cdn,
    "allowance_amount",
    Math.round(allowance_amount)
  );
}

function calculate_bonus_amount(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let bonus_amount =
    (current_row.total_minimum_wage * current_row.bonus_percentage) / 100;
  console.log("Bonus Amount", Math.round(bonus_amount));
  frappe.model.set_value(cdt, cdn, "bonus_amount", Math.round(bonus_amount));
}

// calculate leave
function calculate_leave(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let leave = (current_row.monthly_salary / 26) * 1.8;
  console.log("Leave", Math.round(leave));
  frappe.model.set_value(cdt, cdn, "leave", Math.round(leave));
}

function calculate_leave(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let leave = (current_row.monthly_salary / 26) * 1.8;
  console.log("Leave", Math.round(leave));
  frappe.model.set_value(cdt, cdn, "leave", Math.round(leave));
}

function calculate_over_time_and_public_holiday(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let over_time_and_public_holiday = (current_row.monthly_salary / 26) * 1;
  console.log(
    "over_time_and_public_holiday",
    Math.round(over_time_and_public_holiday)
  );
  frappe.model.set_value(
    cdt,
    cdn,
    "over_time_and_public_holiday",
    Math.round(over_time_and_public_holiday)
  );
}

function calculate_bare_amount(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let bare_amount =
    current_row.total_minimum_wage +
      current_row.epf_amount +
      current_row.allowance_amount +
      current_row.bonus_amount +
      current_row.leave +
      current_row.over_time_and_public_holiday +
      current_row.safety_item +
      current_row.gratuity || 0 + current_row.wc_policy;
  console.log("Bare Amount", Math.round(bare_amount));
  frappe.model.set_value(cdt, cdn, "bare_amount", Math.round(bare_amount));

  calculate_total_amount(frm, cdt, cdn);
}

function calculate_total_amount(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let total_amount =
    current_row.bare_amount +
    current_row.over_head_amount +
    current_row.service_charges_amount;
  console.log("Total", Math.round(total_amount));
  frappe.model.set_value(cdt, cdn, "total_amount", Math.round(total_amount));

  calculate_grand_total_amount(frm, cdt, cdn);
}

function calculate_grand_total_amount(frm, cdt, cdn) {
  let current_row = locals[cdt][cdn];
  let grand_total_amount = current_row.total_amount * current_row.quantity;
  console.log("grand_total_amountTotal", Math.round(grand_total_amount));
  frappe.model.set_value(
    cdt,
    cdn,
    "grand_total_amount",
    Math.round(grand_total_amount)
  );
}

frappe.ui.form.on("Man Days", {
  // project_template: function (frm) {
  //   console.log("run");
  // },
});
