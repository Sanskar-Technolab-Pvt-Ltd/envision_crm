

frappe.ui.form.on("Print Offer", {
  template: function (frm, cdt, cdn) {
    let current_row = locals[cdt][cdn];

    // Fetch the print template details using the API
    if (current_row.template){
    frappe.call({
      method:
        "envision_crm.envision_crm.api.get_data.get_print_template_details",
      args: {
        template: current_row.template,
      },
      callback: function (r) {
        if (!r.exc) {
          // Set template heading and description in the current row
          frappe.model.set_value(
            cdt,
            cdn,
            "heading",
            r.message.template_heading
          );

          frappe.model.set_value(
            cdt,
            cdn,
            "template_details",
            r.message.template_description
          );
        }
      },
    });
  }
  },
});

frappe.ui.form.on("Quotation Cost Estimation Expense", {
  custom_quotation_cost_estimation_expense_add: function (frm, cdt, cdn) {
    // Only show items where is_purchase_item is enabled
    frm.fields_dict["custom_quotation_cost_estimation_expense"].grid.get_field(
      "item"
    ).get_query = function () {
      return {
        filters: {
          is_purchase_item: 1,
        },
      };
    };
  },
});


frappe.ui.form.on("Quotation", {
  items_add: function (frm, cdt, cdn) {
    // Only show items where is_sales_item is enabled

    frm.fields_dict["items"].grid.get_field("item_code").get_query =
      function () {
        return {
          filters: {
            is_sales_item: 1,
          },
        };
      };
  },
  on_submit: function (frm) {
    // Check if the `custom_cost_estimation` field is populated
    if (frm.doc.custom_cost_estimation) {
      // Call the server-side method to submit the linked Cost Estimation
      frappe.call({
        method: "frappe.client.submit",
        args: {
          doctype: "Cost Estimation",
          name: frm.doc.custom_cost_estimation,
        },
        callback: function (r) {
          if (!r.exc) {
            // Success message
            frappe.msgprint(
              __(
                "The linked Cost Estimation document has been submitted successfully."
              )
            );
          } else {
            // Error message
            frappe.msgprint(
              __(
                "An error occurred while submitting the linked Cost Estimation."
              )
            );
          }
        },
      });
    } else {
      // Inform the user if no linked cost estimation is found
      frappe.msgprint(
        __(
          "No linked Cost Estimation document found in 'custom_cost_estimation' field."
        )
      );
    }
  },

  refresh: function (frm) {
    // Remove read-only restriction on the 'party_name' field  
    cur_frm.set_df_property("party_name", "read_only", 0);
    
      // Add "Get Items From Cost Estimation" as an option under the dropdown
      frm.add_custom_button(
        "Cost Estimation",
        function () {
          // Call the function when the option is selected
          fetch_items_from_cost_estimation(frm);
        },
        "Get Items From"
      );
  },

  onload: function (frm) {
    // Only fetch non-submitted Cost Estimation
    frm.set_query("custom_cost_estimation", function () {
      return {
        filters: {
          docstatus: 0,
        },
      };
    });
  },
});

function fetch_items_from_cost_estimation(frm) {
  let cost_estimation_id = frm.doc.custom_cost_estimation;

  if (!cost_estimation_id) {
    frappe.msgprint(
      "Please select a Cost Estimation document before fetching items."
    );
    return;
  }

  // Get items from the selected Cost Estimation
  frappe.call({
    method:
      "envision_crm.envision_crm.api.cost_estimation.get_cost_estimation_items",
    args: { cost_estimation_id: cost_estimation_id },
    callback: function (response) {
      if (response.message) {
        let { selling_items, expense_items } = response.message;

        // Handle Selling Items (Quotation Items Table)
        if (selling_items && selling_items.length > 0) {
          let existing_item_codes = frm.doc.items.map((item) => item.item_code);
          let items_to_fetch = selling_items.filter(
            (item) => !existing_item_codes.includes(item.item_code)
          );

          if (items_to_fetch.length === 0) {
            frappe.msgprint(
              "All selling items from the selected Cost Estimation are already present in the Quotation."
            );
          } else {
            items_to_fetch.forEach((item) => {
              frappe.call({
                method: "frappe.client.get",
                args: {
                  doctype: "Item",
                  name: item.item_code,
                },
                callback: function (item_details_response) {
                  let item_details = item_details_response.message;

                  frm.add_child("items", {
                    item_code: item.item_code,
                    item_name: item_details.item_name,
                    uom: item_details.stock_uom,
                    qty: item.quantity,
                    rate: item.quote_price,
                    custom_estimated_rate: item.quote_price,
                  });

                  frm.refresh_field("items");
                },
              });
            });
          }
        } else {
          frappe.msgprint(
            `No selling items found in the Cost Estimation (${cost_estimation_id}) Selling Items table.`
          );
        }

        // Handle Expense Items (Custom Quotation Cost Estimation Expense Table)
        if (expense_items && expense_items.length > 0) {
          let existing_expense_item_codes =
            frm.doc.custom_quotation_cost_estimation_expense.map(
              (item) => item.item
            );

          let expenses_to_fetch = expense_items.filter(
            (expense_item) =>
              !existing_expense_item_codes.includes(expense_item.item_code)
          );

          if (expenses_to_fetch.length === 0) {
            frappe.msgprint(
              "All expense items from the selected Cost Estimation are already present in the Quotation."
            );
          } else {
            expenses_to_fetch.forEach((expense_item) => {
              frm.add_child("custom_quotation_cost_estimation_expense", {
                item: expense_item.item_code,
                specification: expense_item.capacity,
                moc: expense_item.moc,
                quantity: expense_item.quantity,
                uom:expense_item.uom,
                particulars:expense_item.particulars,
              });

              frm.refresh_field("custom_quotation_cost_estimation_expense");
            });
          }
        } else {
          frappe.msgprint(
            `No expense items found in the Cost Estimation (${cost_estimation_id}) Expense table.`
          );
        }
      } else {
        frappe.msgprint(
          "No data found for the selected Cost Estimation. Please ensure it has Selling and Expense items."
        );
      }
    },
    error: function (err) {
      frappe.msgprint(
        "An error occurred while fetching items from the Cost Estimation document."
      );
      console.error(err);
    },
  });
}
