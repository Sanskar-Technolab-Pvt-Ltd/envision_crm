import frappe


@frappe.whitelist()
def get_print_template_details(template):
    template_details = frappe.get_doc("Quotation Print Templates", template)
    print(template_details)
    return {
        "template_heading": template_details.heading,
        "template_description": template_details.content,
    }
