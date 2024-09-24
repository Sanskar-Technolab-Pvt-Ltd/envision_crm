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


import frappe
from frappe.utils.data import today


# @frappe.whitelist()
# def naming_series(doc, event):
#     # Check if this is a new document
#     if doc.is_new():

#         # If the document is amended, handle the amended naming series
#         if doc.amended_from:
#             # Use the full `amended_from` value for counting
#             base_name = doc.amended_from

#             # Count the number of existing amendments for this document
#             amendment_count = int(frappe.db.count(
#                 "Quotation", filters={"amended_from": base_name}
#             ))


#             print("\n\n\namendment_count", amendment_count, base_name)

#             # Add revision number as _1, _2, etc.
#             doc.name = f"{base_name}_{amendment_count + 1}"  # Increment count by 1
#         else:
#             # If there's no amendment, just assign a standard name (or do nothing)
#             pass  # Handle the case for the original document
