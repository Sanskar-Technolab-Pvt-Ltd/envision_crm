frappe.ui.form.on("Print Offer", {
  template: function (frm, cdt, cdn) {
    let current_row = locals[cdt][cdn];
    console.log(current_row);

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
});
