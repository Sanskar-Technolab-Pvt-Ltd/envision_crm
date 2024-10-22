frappe.ui.form.on("Opportunity", {
  refresh: function (frm) {
    // Check for existing Cost Estimation linked to the current opportunity
    frappe.db.get_list("Cost Estimation", {
        filters: {
            opportunity: frm.doc.name
        },
        fields: ["name", "docstatus"]
    }).then(cost_estimations => {
        // Check if any Cost Estimation is found and if it's in draft (0) or submitted (1)
        const hasDraftOrSubmitted = cost_estimations.some(ce => ce.docstatus === 0 || ce.docstatus === 1);

        // If there are no draft or submitted Cost Estimations, show the button
        if (!hasDraftOrSubmitted) {
            frm.add_custom_button("Create Cost Estimation", () => {
                let new_cost_estimation = frappe.new_doc("Cost Estimation", {
                    opportunity: frm.doc.name,
                    company: frm.doc.company,
                });
            });
        }
    });
}
    
});
