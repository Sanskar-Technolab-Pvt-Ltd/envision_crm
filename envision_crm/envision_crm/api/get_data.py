import frappe


@frappe.whitelist()
def get_print_template_details(template):
    template_details = frappe.get_doc("Quotation Print Templates", template)
    return {
        "template_heading": template_details.heading_name,
        "template_description": template_details.content,
    }


@frappe.whitelist()
def get_quotation_selling_items_details(cost_estimation_id, item_name):
    quotation_selling_items_details_list = frappe.get_value(
        "Quotation Selling Items",
        {
            "parent": cost_estimation_id,
            "item_code": item_name,
        },
        [
            "item_code",
            "unloading_percentage",
            "transportation_percentage",
            "erection_percentage",
            "profit_percentage",
        ],
        as_dict=True,
    )

    # quotation_selling_items_length = frappe.get_all(
    #     "Quotation Selling Items",
    #     filters={
    #         "parent": cost_estimation_id,
    #     },
    #     fields=[
    #         "item_code",
    #     ],
    # )

    # print("\n\n\n\nLength", len(quotation_selling_items_details_list))
    print("\n\n\n\nget value ", quotation_selling_items_details_list)

    if quotation_selling_items_details_list == None:
        frappe.msgprint(item_name + " item not available in Selling table")
        # print("\n\n Selling ", quotation_selling_items_details_list)
    else:
        print("\n\n Selling ", quotation_selling_items_details_list)
        return quotation_selling_items_details_list
