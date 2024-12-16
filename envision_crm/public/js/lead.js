frappe.ui.form.on("Lead", {
  refresh: function (frm) {
    // Add custom button to create a new opportunity if the lead is not new and not linked to a customer
    if (!frm.is_new() && frm.doc.__onload && !frm.doc.__onload.is_customer) {
      frm.add_custom_button(
        __("New Opportunity"),
        function () {
          frm.trigger("make_custom_opportunity");
        },
        __("Create")
      );

      // Remove unwanted buttons from the Lead form after a short delay
      setTimeout(() => {
        frm.remove_custom_button("Add to Prospect", "Action");
        frm.remove_custom_button("Opportunity", "Create");
        frm.remove_custom_button("Prospect", "Create");
      }, 100);
    }
  },

  after_save: function (frm) {
    // Run the following actions in sequence after saving the lead
    frappe.run_serially([
      // Remove unwanted buttons if the form is saved
      () => {
        if (!frm.is_new() || frm.doc.__saved) {
          setTimeout(() => {
            frm.remove_custom_button("Add to Prospect", "Action");
            frm.remove_custom_button("Opportunity", "Create");
            frm.remove_custom_button("Prospect", "Create");
          }, 0);
        }
      },

      // Add the "New Opportunity" button again if the lead is not linked to a customer
      () => {
        if (
          !frm.is_new() &&
          frm.doc.__onload &&
          !frm.doc.__onload.is_customer
        ) {
          setTimeout(() => {
            frm.add_custom_button(
              __("New Opportunity"),
              function () {
                frm.trigger("make_custom_opportunity");
              },
              __("Create")
            );
          }, 100);
        }
      },
    ]);
  },

  make_custom_opportunity: async function (frm) {
    // Prepare fields for the dialog (currently no fields are defined)
    var fields = [];

    // Check if a contact with the same name already exists
    var existing_contact = (
      await frappe.db.get_value(
        "Contact",
        {
          first_name: frm.doc.first_name || frm.doc.lead_name,
          last_name: frm.doc.last_name,
        },
        "name"
      )
    ).message.name;

    // Show a dialog for opportunity creation if there are fields defined
    if (fields.length > 0) {
      var d = new frappe.ui.Dialog({
        title: __("Create Opportunity"),
        fields: fields,
        primary_action: function () {
          // Handle the creation process when the dialog is submitted
          var data = d.get_values();
          frappe.call({
            method: "create_contact_and_opportunity",
            doc: frm.doc,
            args: {
              data: data,
            },
            freeze: true,
            callback: function (r) {
              if (!r.exc) {
                frappe.model.open_mapped_doc({
                  method: "erpnext.crm.doctype.lead.lead.make_opportunity",
                  frm: frm,
                });
              }
              d.hide();
            },
          });
        },
        primary_action_label: __("Create"),
      });
      d.show();
    } else {
      // If no fields are defined, directly map the lead to a new opportunity
      frappe.model.open_mapped_doc({
        method: "erpnext.crm.doctype.lead.lead.make_opportunity",
        frm: frm,
      });
    }
  },
});
