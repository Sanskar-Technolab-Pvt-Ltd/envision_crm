frappe.ui.form.on("Lead", {
  refresh: function (frm) {
    // Hide the element with data-doctype="Prospect"
    $('[data-doctype="Prospect"]').hide();

    setTimeout(() => {
      frm.remove_custom_button("Add to Prospect", "Action");
      frm.remove_custom_button("Prospect", "Create");
      //   $(".icon-btn").remove();
    }, 0);
  },
});
