

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

     // ? SHOW TENDER PRICE BUTTON
    showBiddingHistory(frm);


    //? SHOW MATERIAL REQUEST BUTTON
    materialRequestButton(frm);


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


function showBiddingHistory(frm) {
    //? IF QUOTATION TYPE IS NOT TENDER
    if (frm.doc.custom_quotation_type != 'Tender'){
        return;
    }

    // // ? IF NOT PARTY NAME
    // if (!frm.doc.party_name) {
    //     return;
    // }

    // ? ADD BIDDING HISTORY BUTTON
    frm.add_custom_button('Show Bidding History', function () {

        // // ? IF NO CUSTOMER SELECTED
        // if (!frm.doc.party_name || !frm.doc.quotation_to || frm.doc.party_name === "") {
        //     frappe.show_alert(__('Please Select a Customer First.'));
        //     return;
        // }

        // ? IF NO ITEMS
        if (frm.doc.items.length === 0) {
            frappe.show_alert(__('Please Add Items First.'));
            return;
        }

        frappe.call({
            method: "envision_crm.envision_crm.api.create_quotation.get_previous_bids",
            args: {
                items: frm.doc.items.map(item => item.item_code)
            },
            callback: function (response) {
                // ? IF SUCCESS
                if (response.message.data.length > 0) {

                    // ? SHOW THE TENDER PRICES
                    showPreviousBidsDialog(response.message.data, frm);
                } else {
                    frappe.msgprint(__('No previous bids found for this Quotation.'));
                }
            }
        });
    },__('History'));
}



//? FUNCTION TO SHOW THE PREVIOUS BIDS DIALOG
function showPreviousBidsDialog(data, frm) {
    // ? GET ALL ITEM CODES FROM THE FORM
    let requestedItems = frm.doc.items.map(item => item.item_code);

    // ? GET ALL ITEM CODES FROM THE DATA
    let returnedItems = data.map(row => row.products);

    // ? IDENTIFY MISSING ITEMS
    let missingItems = requestedItems.filter(item => !returnedItems.includes(item));

    // ? CREATE THE HTML FOR THE DIALOG
    let html = `
        <div style="max-height: 600px; overflow-y: auto;">
            <table class="table table-bordered">
                <thead>
                    <tr>
                    <th>Item Name</th>
                    <th>Bidder Name</th>
                    <th>Tender Amount</th>
                    <th>Tender Opportunity</th>
                    <th>Opportunity Name</th>
                    <th>Submission Date</th>
                    </tr>
                </thead>
                <tbody>`;

    // ? LOOP THROUGH THE DATA AND CREATE THE HTML
    requestedItems.forEach(item_code => {
        // ? FILTER ROWS MATCHING THIS ITEM CODE
        let itemRows = data.filter(row => row.products === item_code);

        if (itemRows.length > 0) {
            itemRows.forEach(row => {
                let formattedAmount = new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR'
                }).format(row.quoted_amount);

                html += `<tr style="padding:6px !important;">
                    <td style="padding:6px !important;">${row.products}</td>
                    <td style="padding:6px !important;">${row.bidder_name}</td>
                    <td style="padding:6px !important;">${formattedAmount}</td>
                    <td style="padding:6px !important;"><a href="/app/tender-opportunity/${row.parent}" target="_blank">${row.parent}</a></td>
                    <td style="padding:6px !important;">${row.opportunity_name}</td>
                    <td style="padding:6px !important;">${row.submission_due_date}</td>
                </tr>`;
            });
        }
    });

    // ? ADD A ROW FOR ITEMS WITH NO PREVIOUS TENDER PRICES
    if (missingItems.length > 0) {
        missingItems.forEach(item => {
            html += `<tr style="background-color:rgb(247, 220, 222); color:rgb(0, 0, 0); padding:5px !important;">
                <td style="padding:6px !important;">${item}</td>
                <td style="padding:6px !important; color:rgb(167, 82, 82);" colspan="5"><strong><center>No previous bids found for this item</center></strong></td>
            </tr>`;
        });
    }

    // ? CLOSE THE TABLE
    html += `</tbody></table></div>`;

    // ? CREATE THE DIALOG
    let dialog = new frappe.ui.Dialog({
        title: "Previous Bids",
        size: "extra-large",
        fields: [{ fieldname: "table_html", fieldtype: "HTML" }]
    });

    // ? SHOW THE DIALOG
    dialog.fields_dict.table_html.$wrapper.html(html);
    dialog.show();
}


//? FUNCTION TO ADD MAKE MATERIAL REQUEST BUTTON
function materialRequestButton(frm){
    //? ADD BUTTON ONLY IF QUOTATION_TYPE IS "TENDER" AND DOC IS NOT NEW
    if (frm.doc.custom_quotation_type === 'Tender' && (!frm.is_new())) {
        //? CHECH IF MATERAIL REQUEST IS EXIST FOR QUOTATION OR NOT
        frappe.call({
            method: 'envision_crm.envision_crm.api.controller.get_list_of_available_records',
            args: {
                doctype: 'Material Request',
                filters: { custom_tender_reference: frm.doc.custom_tender_opportunity},
                fields: ['name'],
                limit_page_length: 1
            },
            callback: function (r) {
                if (r.message.length === 0) {
                    frm.add_custom_button('Material Request', function() {
                        //? REDIRECT TO MATERIAL REQUEST PAGE
                        frappe.model.with_doctype('Material Request', function() {
                            var mr = frappe.model.get_new_doc('Material Request');

                            mr.custom_tender_reference = frm.doc.custom_tender_opportunity;

                            //? ADD ITEMS WHICH IS ALLOW FOR PURCHASE
                            frappe.call({
                                method: "envision_crm.envision_crm.api.create_quotation.get_purchase_items",
                                args: {
                                    item_data: JSON.stringify((frm.doc.items || []).map(item => ({
                                        item_code: item.item_code,
                                        qty: item.qty
                                    }))),
                                    doc_name : frm.doc.name
                                },
                                callback: function(r) {
                                    if (r.message) {
                                        r.message.forEach(function(data) {
                                            let mr_item = frappe.model.add_child(mr, 'items');
                                            frappe.model.set_value(mr_item.doctype, mr_item.name, 'item_code', data.item_code);
                                            frappe.model.set_value(mr_item.doctype, mr_item.name, 'qty', data.qty);
                                        });
                                    }
                                }
                            });

                            //? SET VALUES IN MATERIAL REQUEST FORM
                            frappe.set_route('Form', 'Material Request', mr.name);
                        });
                    },__('Create'));
                }
            }
        });
    }
}
