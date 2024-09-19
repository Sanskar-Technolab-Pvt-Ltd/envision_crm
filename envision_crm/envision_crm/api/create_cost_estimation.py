import frappe


@frappe.whitelist()
def create_cost_estimation(opportunity):
    try:

        # Create and populate Quotation
        new_cost_estimation = frappe.new_doc("Cost Estimation")
        new_cost_estimation.update(
            {
                "opportunity": opportunity,
                # "party_name": opportunity_details.party_name,
                # "custom_cost_estimation": cost_estimation_id,
            }
        )

        # # Insert the new Quotation document into the database and commit
        new_cost_estimation.insert(ignore_permissions=True)
        # frappe.db.commit()
        frappe.msgprint("Cost Estimation created successfully")

        # return {
        #     "status": "success",
        #     "message": ("Cost Estimation created successfully"),
        # }

    except frappe.DoesNotExistError as e:
        return {"status": "error", "message": f"Document not found: {str(e)}"}
