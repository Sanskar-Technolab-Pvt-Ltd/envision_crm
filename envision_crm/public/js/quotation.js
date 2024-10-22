frappe.ui.form.on("Print Offer", {
  template: function (frm, cdt, cdn) {
    let current_row = locals[cdt][cdn];
    console.log("Hii", current_row);

    frappe.call({
      method:
        "envision_crm.envision_crm.api.get_data.get_print_template_details",
      args: {
        template: current_row.template,
      },
      callback: function (r) {
        if (!r.exc) {
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
  // validate: function(frm) {
  //   if (frm.doc.quotation_value > 500000) {
  //       frm.set_value('workflow_state', 'Draft');
  //       frm.set_df_property('workflow_name', 'options', 'Quotation Approval (Over 5 Lakhs)');
  //   } else {
  //       frm.set_value('workflow_state', 'Draft');
  //       frm.set_df_property('workflow_name', 'options', 'Quotation Approval (Up to 5 Lakhs)');
  //   }
// }
});
