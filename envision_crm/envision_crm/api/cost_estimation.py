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


@frappe.whitelist()
def submit_cost_estimation(doc, method):
    # Automatically submit the linked Cost Estimation document when the Quotation is submitted.

    if doc.custom_cost_estimation:
        try:
            # Load the Cost Estimation document
            cost_estimation = frappe.get_doc(
                "Cost Estimation", doc.custom_cost_estimation
            )

            # Check if it's not already submitted
            if cost_estimation.docstatus == 0:
                # Submit the Cost Estimation document
                cost_estimation.submit()
                frappe.msgprint(
                    f"The linked Cost Estimation '{cost_estimation.name}' has been submitted successfully."
                )
        except Exception as e:
            # Log the error and notify the user
            frappe.log_error(frappe.get_traceback(), "Cost Estimation Submission Error")
            # frappe.msgprint(
            #     f"An error occurred while submitting the linked Cost Estimation: {str(e)}",
            #     alert=True,
            # )


# In your custom app's appropriate Python file (e.g., cost_estimation.py)


@frappe.whitelist()
# def get_cost_estimation_items(cost_estimation_id):
#     if not cost_estimation_id:
#         frappe.throw("Cost Estimation ID is required.")

#     # Fetch items from the child table
#     return frappe.get_all(
#         "Quotation Selling Items",
#         filters={"parent": cost_estimation_id},
#         fields=["item_code", "quantity", "rate", "amount", "idx", "quote_price"],
#         order_by="idx",
#     )


@frappe.whitelist()
def get_cost_estimation_items(cost_estimation_id):
    if not cost_estimation_id:
        frappe.throw("Cost Estimation ID is required.")

    # Fetch items from the Quotation Selling Items child table
    selling_items = frappe.get_all(
        "Quotation Selling Items",
        filters={"parent": cost_estimation_id},
        fields=["item_code", "quantity", "rate", "amount", "idx", "quote_price"],
        order_by="idx",
    )

    # Fetch items from the Cost Estimation Expense child table
    expense_items = frappe.get_all(
        "Cost Estimation Expense",
        filters={"parent": cost_estimation_id},
        fields=["item_code", "capacity", "moc", "quantity","uom","particulars"],
        order_by="idx",
    )

    return {
        "selling_items": selling_items,
        "expense_items": expense_items,
    }


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
