import frappe 
from frappe import _

from frappe.contacts.address_and_contact import load_address_and_contact
from frappe.email.inbox import link_communication_to_document
from frappe.model.mapper import get_mapped_doc
from frappe.query_builder import DocType, Interval
from frappe.query_builder.functions import Now
from frappe.utils import flt, get_fullname

from erpnext.setup.utils import get_exchange_rate
from erpnext.utilities.transaction_base import TransactionBase


@frappe.whitelist()
def make_quotation_from_cost_estimation(cost_estimation_id, target_doc=None):
    def set_missing_values(source, target):
        from erpnext.controllers.accounts_controller import (
            get_default_taxes_and_charges,
        )

        # Get the quotation document
        quotation = frappe.get_doc(target)

        company_currency = frappe.get_cached_value(
            "Company", quotation.company, "default_currency"
        )

        # Determine exchange rate
        if company_currency == quotation.currency:
            exchange_rate = 1
        else:
            exchange_rate = get_exchange_rate(
                quotation.currency,
                company_currency,
                quotation.transaction_date,
                args="for_selling",
            )

        quotation.conversion_rate = exchange_rate

        # Fetch default taxes and update
        taxes = get_default_taxes_and_charges(
            "Sales Taxes and Charges Template", company=quotation.company
        )
        if taxes.get("taxes"):
            quotation.update(taxes)

        # Run missing values and totals calculations
        quotation.run_method("set_missing_values")
        quotation.run_method("calculate_taxes_and_totals")

        # Link the opportunity if not already linked
        if not quotation.opportunity:
            quotation.opportunity = source.opportunity

    # Fetch the Cost Estimation document
    cost_estimation = frappe.get_doc("Cost Estimation", cost_estimation_id)
    if not cost_estimation.opportunity:
        frappe.throw("No Opportunity is linked with this Cost Estimation.")

    # Fetch items from the "Quotation Selling Items" child table
    selling_items = frappe.get_all(
        "Quotation Selling Items",
        filters={"parent": cost_estimation_id},
        fields=[
            "item_code",
            "quantity",
            "rate",
            "amount",
            "idx",
            "quote_price",
        ],
        order_by="idx",
    )

    if not selling_items:
        frappe.throw(f"No selling items found for Cost Estimation {cost_estimation_id}")

    # Fetch rows from the "Cost Estimation Expense" child table
    cost_estimation_expenses = frappe.get_all(
        "Cost Estimation Expense",
        filters={"parent": cost_estimation_id},
        fields=["item_code", "capacity", "moc", "quantity","particulars","uom"],
        order_by="idx",
    )

    # Map fields from Cost Estimation and Opportunity to Quotation
    doclist = get_mapped_doc(
        "Opportunity",
        cost_estimation.opportunity,
        {
            "Opportunity": {
                "doctype": "Quotation",
                "field_map": {"opportunity_from": "quotation_to", "name": "enq_no"},
            },
        },
        target_doc,
        set_missing_values,
    )

    # Append items from the Cost Estimation's "Quotation Selling Items" child table
    for item in selling_items:
        # Fetch item details
        item_details = frappe.get_value(
            "Item",
            item.item_code,
            ["item_name", "stock_uom"],
            as_dict=True,
        )

        if not item_details:
            frappe.throw(f"Item Code {item.item_code} not found in the Item master.")

        doclist.append(
            "items",
            {
                "item_code": item.item_code,
                "item_name": item_details.item_name,
                "uom": item_details.stock_uom,
                "qty": item.quantity,
                "rate": item.quote_price,
                "custom_estimated_rate": item.quote_price,
                # "amount": item.amount,
            },
        )

    # Append rows from the Cost Estimation's "Cost Estimation Expense" child table
    for expense in cost_estimation_expenses:
        doclist.append(
            "custom_quotation_cost_estimation_expense",
            {
                "item": expense.item_code,
                "specification": expense.capacity,
                "moc": expense.moc,
                "quantity": expense.quantity,
                "particulars":expense.particulars,
                "uom":expense.uom,
            },
        )

    # Link the Cost Estimation in the Quotation
    doclist.custom_cost_estimation = cost_estimation_id

    return doclist


# ? FUNCTION TO GET PREVIOUS BIDS HISTORY FOR QUOTATION
@frappe.whitelist()
def get_previous_bids(items):
    try:

        # ? PARSE ITEMS DATA
        items = frappe.parse_json(items)

        # ? GENERATE FILTERS
        filters = {
            "products": ["in", items]
        }

        # ? GET PRICES
        tender_prices = frappe.get_all(
            "Bidders Information",
            filters=filters,
            fields=["parent", "products", "quoted_amount", "bidder_name"],
            order_by="creation desc"
        )

        # ? GET THE OPPORTUNITY NAME
        for row in tender_prices:
            tender_opportunity_fields = frappe.db.get_value(
                "Tender Opportunity",
                row["parent"],
                ["opportunity_name", "submission_due_date"]
            )

            if tender_opportunity_fields:
                row["opportunity_name"] = tender_opportunity_fields[0]
                row["submission_due_date"] = tender_opportunity_fields[1]

        # ? IF PRICES DOES NOT EXIST
        if not tender_prices:
            return {"success": True, "message": "No tender prices found.", "data": []}

    # ? HANDLE ERROR
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to get Tender Prices data: {str(e)}",
            "data": None,
        }

    # ? HANDLE SUCCESS
    else:
        return {
            "success": True,
            "message": "Tender Prices data retrieved successfully!",
            "data": tender_prices,
        }


#? FUNCTION TO GET THE ITEMS FOR CREATE MATERIAL REQUEST FROM THE QUOTATION
@frappe.whitelist()
def get_purchase_items(item_data, doc_name):
    import json
    item_data = json.loads(item_data) if isinstance(item_data, str) else item_data

    result_items = []

    for item in item_data:
        #? GET ITEM CODE AND QUANTITY
        code = item.get("item_code")
        qty = item.get("qty", 1)

        frappe.log_error("code is:", code)

        #? CHECK IF IT'S A PRODUCT BUNDLE
        packed_items = frappe.get_all("Packed Item", filters={"parent_item": code, "parent": doc_name}, fields=["item_code", "qty"])

        if packed_items:
            for p_item in packed_items:
                is_purchase = frappe.db.get_value("Item", p_item.item_code, "is_purchase_item")
                if is_purchase:
                    result_items.append({
                        "item_code": p_item.item_code,
                        "qty": p_item.qty
                    })
        # ? IF ITEM IS NOT BUNDLE ITEM
        else:
            is_purchase = frappe.db.get_value("Item", code, "is_purchase_item")
            if is_purchase:
                result_items.append({
                    "item_code": code,
                    "qty": qty
                })

    return result_items