import frappe


@frappe.whitelist()
def get_print_template_details(template):
    template_details = frappe.get_doc("Quotation Print Templates", template)
    return {
        "template_heading": template_details.heading_name,
        "template_description": template_details.content,
    }
