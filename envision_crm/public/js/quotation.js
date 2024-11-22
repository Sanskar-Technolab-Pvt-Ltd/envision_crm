// frappe.ui.form.on("Print Offer", {
//   template: function (frm, cdt, cdn) {
//     let current_row = locals[cdt][cdn];
//     console.log("Hii", current_row);

//     frappe.call({
//       method:
//         "envision_crm.envision_crm.api.get_data.get_print_template_details",
//       args: {
//         template: current_row.template,
//       },
//       callback: function (r) {
//         if (!r.exc) {
//           frappe.model.set_value(
//             cdt,
//             cdn,
//             "heading",
//             r.message.template_heading
//           );

//           frappe.model.set_value(
//             cdt,
//             cdn,
//             "template_details",
//             r.message.template_description
//           );
//         }
//       },
//     });
//   },

//   after_save: function (frm) {
//     // Check if the quotation is submitted
//     if (frm.doc.docstatus === 1 && frm.doc.custom_cost_estimation) {
//       // Call the server-side method to submit the linked cost estimation
//       frappe.call({
//         method: "frappe.client.submit",
//         args: {
//           doctype: "Cost Estimation",
//           name: frm.doc.custom_cost_estimation,
//         },
//         callback: function (r) {
//           if (!r.exc) {
//             frappe.msgprint(
//               __(
//                 "The linked Cost Estimation document has been submitted successfully."
//               )
//             );
//           } else {
//             frappe.msgprint(
//               __(
//                 "An error occurred while submitting the linked Cost Estimation."
//               )
//             );
//           }
//         },
//       });
//     }
//   },
// });




frappe.ui.form.on("Print Offer", {
  template: function (frm, cdt, cdn) {
    let current_row = locals[cdt][cdn];
    console.log("Hii", current_row);

    // Fetch the print template details using the API
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
  },

  
});

frappe.ui.form.on("Quotation", {
  
  on_submit: function (frm) {
    // Check if the `custom_cost_estimation` field is populated
    console.log("Working")
    if (frm.doc.custom_cost_estimation) {
      // Call the server-side method to submit the linked Cost Estimation
      frappe.call({
        method: "frappe.client.submit",
        args: {
          doctype: "Cost Estimation", // The doctype name for the cost estimation
          name: frm.doc.custom_cost_estimation, // The linked cost estimation document
        },
        callback: function (r) {
          if (!r.exc) {
            // Success message
            frappe.msgprint(
              __("The linked Cost Estimation document has been submitted successfully.")
            );
          } else {
            // Error message
            frappe.msgprint(
              __("An error occurred while submitting the linked Cost Estimation.")
            );
          }
        },
      });
    } else {
      // Inform the user if no linked cost estimation is found
      frappe.msgprint(
        __("No linked Cost Estimation document found in 'custom_cost_estimation' field.")
      );
    }
  },


});
