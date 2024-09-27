frappe.ui.form.on("Opportunity", {
  refresh: function (frm) {
    // Add button to open new cost estimation from 
    frm.add_custom_button("Create Cost Estimation", () => {
      let new_cost_estimation = frappe.new_doc("Cost Estimation", {
        opportunity: frm.doc.name,
      });
    });
  },
});
