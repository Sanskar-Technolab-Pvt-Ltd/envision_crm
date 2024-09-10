frappe.ui.form.on("Cost Estimation", {
  refresh: function (frm) {
    frm.add_custom_button("Create Quotation", () => {
      frappe.msgprint("You Clicked Me");
    });
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
          console.log(r.message);

          // let row = frm.add_child("man_days", {
          //   activities: "Admin",
          // });
          frm.clear_table("man_days");
          // Refresh the fields to reflect the changes
          frm.set_value("total_man_days_amount", 0);
          frm.refresh_field("total_man_days_amount");

          let task_mapping = r.message;

          // Iterate over the parent tasks
          for (let parent_task in task_mapping) {
            let parent_subject = task_mapping[parent_task].subject;
            // let parent_task_id = task_mapping[parent_task];
            // console.log("PArent id ", parent_task);
            let children = task_mapping[parent_task].children;

            // Check if there are any child tasks
            if (children.length > 0) {
              // Iterate over each child task for the current parent task
              children.forEach((child_task) => {
                // Add a new row for each child task
                let row = frm.add_child("man_days");

                // Set the parent task's subject in the "stages_of_project" field
                frappe.model.set_value(
                  row.doctype,
                  row.name,
                  "parent_task",
                  parent_task
                );
                frappe.model.set_value(
                  row.doctype,
                  row.name,
                  "stages_of_project",
                  parent_subject
                );

                frappe.model.set_value(
                  row.doctype,
                  row.name,
                  "child_task",
                  child_task[0]
                );

                // Set the child task's subject in the "activities" field
                frappe.model.set_value(
                  row.doctype,
                  row.name,
                  "activities",
                  child_task[1] // child_task[1] is the child task's subject
                );
              });
            } else {
              // If there are no child tasks, add a single row for the parent task
              let row = frm.add_child("man_days");

              // Set the parent task's subject in both fields since there are no children
              frappe.model.set_value(
                row.doctype,
                row.name,
                "parent_task",
                parent_task
              );
              frappe.model.set_value(
                row.doctype,
                row.name,
                "stages_of_project",
                parent_subject
              );

              // frappe.model.set_value(
              //   row.doctype,
              //   row.name,
              //   "stages_of_project",
              //   parent_subject
              // );
              // frappe.model.set_value(
              //   row.doctype,
              //   row.name,
              //   "activities",
              //   parent_subject
              // );
            }
          }

          // Refresh the child table after adding rows
          frm.refresh_field("man_days");
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
  let total_minimum_wage = minimum_wages * working_days;

  frappe.model.set_value(cdt, cdn, "total_minimum_wage", Math.round(total_minimum_wage));

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
  frappe.model.set_value(cdt, cdn, "allowance_amount", Math.round(allowance_amount));
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

  frappe.model.set_value(cdt, cdn, "grand_total_amount", Math.round(grand_total_amount));
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
  frm.set_value("total_amount_with_over_head_and_service_charges", total_amount_with_over_head_and_service_charges);
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
          console.log("Fetched and stored Per Day Hour:", per_day_hour);

          // Execute callback once data is fetched
          if (callback) callback();
        }
      },
    });
  } else {
    console.log("Using cached Per Day Hour:", per_day_hour);

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
    let level_1_amount =
      level_wise_per_hour_amounts.find((l) => l.level === "Level 1").amount *
      level_1_hours;
    let level_2_amount =
      level_wise_per_hour_amounts.find((l) => l.level === "Level 2").amount *
      level_2_hours;
    let level_3_amount =
      level_wise_per_hour_amounts.find((l) => l.level === "Level 3").amount *
      level_3_hours;
    let level_4_amount =
      level_wise_per_hour_amounts.find((l) => l.level === "Level 4").amount *
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

  console.log("Total hours:", total_hours);

  frappe.model.set_value(cdt, cdn, "total_hours", Math.round(total_hours));
}

// Handle hour changes
function handle_hours_change(frm, cdt, cdn, hour_field) {
  try {
    total_hours(frm, cdt, cdn); // Update total hours
    console.log(`Updated ${hour_field}`);
  } catch (error) {
    console.error(`Error updating ${hour_field}:`, error);
  }
}

// Event handling for Man Days calculations
frappe.ui.form.on("Man Days", {
  man_days_remove: function (frm, cdt, cdn) {
    // if (frm.doc.quotation_items.length >= 1) {
    update_total_man_days_amount(frm);
    console.log(" man ok");
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
