# Copyright (c) 2025, Prompt Group and contributors
# For license information, please see license.txt

import frappe
from frappe.model.mapper import get_mapped_doc
from frappe.model.document import Document
from frappe.contacts.address_and_contact import load_address_and_contact


class TenderOpportunity(Document):
    def onload(self):
        ref_doc = frappe.get_doc(self.opportunity_from, self.party)

        load_address_and_contact(ref_doc)
        load_address_and_contact(self)

        ref_doc_contact_list = ref_doc.get("__onload").get("contact_list")
        opportunity_doc_contact_list = [
            contact
            for contact in self.get("__onload").get("contact_list")
            if contact not in ref_doc_contact_list
        ]
        ref_doc_contact_list.extend(opportunity_doc_contact_list)
        ref_doc.set_onload("contact_list", ref_doc_contact_list)

        ref_doc_addr_list = ref_doc.get("__onload").get("addr_list")
        tender_opportunity_doc_addr_list = [
            addr for addr in self.get("__onload").get("addr_list") if addr not in ref_doc_addr_list
        ]
        ref_doc_addr_list.extend(tender_opportunity_doc_addr_list)
        ref_doc.set_onload("addr_list", ref_doc_addr_list)

        self.set("__onload", ref_doc.get("__onload"))

    def on_update(self):
        # ? SHARE DOC WITH OTHER USERS
        share_doc_to_users(self)


# ! prompt_marketing.prompt_marketing.doctype.tender_opportunity.tender_opportunity.create_project
# ? FUNCTION TO CREATE PROJECT
@frappe.whitelist()
def create_project(tender_opportunity, project_name, project_template):
    try:

        # ? CREATE PROJECT
        project = frappe.new_doc("Project")
        project.update(
            {
                "project_name": project_name,
                "custom_tender_opportunity": tender_opportunity,
                "project_template": project_template,
            }
        )

        # ? SAVE PROJECT
        project.save()

    # ? HANDLE ERROR
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to create Project: {str(e)}",
            "data": None,
        }

    # ? HANDLE SUCCESS
    else:
        return {
            "success": True,
            "message": "Project created successfully!",
            "data": project.name,
        }


# ! prompt_marketing.prompt_marketing.doctype.tender_opportunity.tender_opportunity.create_quotation
# ? FUNCTION TO CREATE PROJECT
@frappe.whitelist()
def create_quotation(quotation_to, party_name, tender_opportunity, items):
    try:

        # ? PARSE ITEMS DATA
        items = frappe.parse_json(items)

        # ? CREATE QUOTATION
        quotation = frappe.get_doc(
            {
                "doctype": "Quotation",
                "quotation_to": quotation_to,
                "party_name": party_name,
                "custom_tender_opportunity": tender_opportunity,
                "custom_quotation_type": "Tender",
                "items": items,
            }
        )

        # # ? SAVE QUOTATION
        # quotation.save()

    # ? HANDLE ERROR
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to create Quotation: {str(e)}",
            "data": None,
        }

    # ? HANDLE SUCCESS
    else:
        return {
            "success": True,
            "message": "Quotation created successfully!",
            "data": quotation.name,
        }


# ! prompt_marketing.prompt_marketing.doctype.tender_opportunity.tender_opportunity.create_sales_contract
# ? FUNCTION TO CREATE PROJECT
@frappe.whitelist()
def create_sales_contract(tender_opportunity):
    try:
        # ? GET THE SUBMITTED QUOTATION WITH TENDER OPPORTUNITY REFERENCE
        quotation = frappe.get_value(
            "Quotation",
            filters={
                "custom_tender_opportunity": tender_opportunity,
                "docstatus": 1,
            },
            fieldname=["name", "party_name"],
            as_dict=True,
        )

        # ? IF NO QUOTATION EXISTS
        if not quotation:
            return {
                "success": False,
                "message": "No submitted quotation found for the given tender opportunity.",
                "data": None,
            }

        # ? CREATE BLANKET ORDER MAPPED DOCUMENT
        blanket_order = get_mapped_doc(
            "Quotation",
            quotation.name,
            {
                "Quotation": {
                    "doctype": "Blanket Order",
                    "field_map": {
                        "name": "order_no",
                        "party_name": "customer",
                    },
                },
                "Quotation Item": {
                    "doctype": "Blanket Order Item",
                    "field_map": {
                        "item_code": "item_code",
                        "rate": "rate",
                        "qty": "qty",
                    },
                },
            },
            ignore_permissions=True
        )
        # ? UPDATE BLANKET ORDER TYPE
        blanket_order.update({"blanket_order_type": "Selling"})


    # ? HANDLE ERROR
    except Exception as e:
        frappe.log_error(
            message=str(e),
            title="Error in creating sales contract",
        )
        return {
            "success": False,
            "message": f"Failed to create Quotation: {str(e)}",
            "data": None,
        }

    # ? HANDLE SUCCESS
    else:
        return {
            "success": True,
            "message": "Quotation created successfully!",
            "data": blanket_order.as_dict(),
        }


# ! envision_crm.envision_crm.doctype.tender_opportunity.tender_opportunity.get_primary_billing_address_for_customer
@frappe.whitelist()
def get_primary_billing_address_for_customer(customer):
    linked_addresses = frappe.get_all("Dynamic Link",
                                      filters={
                                          "link_doctype": "Customer",
                                          "link_name": customer,
                                          "parenttype": "Address"
                                      },
                                      fields=["parent"]
                                      )

    if linked_addresses:
        # ? Now, filter out the primary billing address with custom_is_main_address
        address = frappe.get_all("Address",
                                 filters={
                                     "name": ["in", [link.parent for link in linked_addresses]],
                                     "is_primary_address": 1,
                                     "address_type": "Billing",
                                     "custom_is_primary_address": 1,
                                     "disabled": 0
                                 },
                                 fields=["name"]
                                 )

        if address:
            # ? If a valid address is found, return it
            address_name = address[0].name
            return {
                "name": address_name,
            }

    return None


# ! prompt_marketing.prompt_marketing.doctype.tender_opportunity.tender_opportunity.get_previous_tender_opportunity_data
# ? FUNCTION TO GET PREVIOUS TENDER OPPORTUNITY DATA
@frappe.whitelist()
def get_previous_tender_opportunity_data(customer, items):
    try:

        # ? PARSE ITEMS DATA
        items = frappe.parse_json(items)

        # ? GET TENDER OPPORTUNITY
        tender_opportunity = frappe.get_all(
            "Tender Opportunity",
            filters={'party': customer, "docstatus": 0},
            fields=["name", "transaction_date"],
            order_by="transaction_date desc"
        )

        # ? IF TENDER OPPORTUNITY DOES NOT EXIST
        if not tender_opportunity:
            return {"success": True, "message": "No previous tender opportunity found.", "data": []}

        # ? GET TENDER OPPORTUNITY NAMES AND GENERATE MAP
        tender_opportunity_names = [opportunity["name"] for opportunity in tender_opportunity]
        tender_opportunity_map = {opportunity["name"]: opportunity.get("transaction_date") for opportunity in
                                  tender_opportunity}

        # ? GET TENDER OPPORTUNITY ITEMS
        tender_opportunity_items = frappe.get_all(
            "Tender Opportunity Items",
            filters={"parent": ["in", tender_opportunity_names], "product_category": ["in", items]},
            fields=["parent", "rate", "product_category"],
            order_by="parent desc",
            limit=20
        )

        # ? GENERATE TENDER OPPORTUNITY ITEM MAP
        tender_opportunity_item_map = {}
        for item in tender_opportunity_items:
            if item.get("product_category") not in tender_opportunity_item_map:
                tender_opportunity_item_map[item["product_category"]] = []
            tender_opportunity_item_map[item["product_category"]].append(item)

        # ? GENERATE DATA
        data = []

        # ? GET DATA FOR EACH ITEM
        for product_category in items:

            # ? CHECK IF ITEM CODE EXISTS IN TENDER OPPORTUNITY ITEM MAP
            if product_category in tender_opportunity_item_map:

                # ? GET DATA FOR EACH ITEM CODE
                for item in tender_opportunity_item_map[product_category]:
                    data.append({
                        "product_category": item.get("product_category"),
                        "tender_opportunity": item["parent"],
                        "rate": frappe.format_value(item["rate"], {"fieldtype": "Currency"}),
                        "party_name": customer,
                        "transaction_date": tender_opportunity_map[item["parent"]]
                    })

    # ? HANDLE ERROR
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to get Tender Opportunity data: {str(e)}",
            "data": None,
        }

    # ? HANDLE SUCCESS
    else:
        return {
            "success": True,
            "message": "Tender Opportunity data retrieved successfully!",
            "data": data,
        }


# ? auto assign and share Tender Opportunity to setted user in table
def share_doc_to_users(doc):
    """This automatically assigns and shares the document on the on_update event, based on the user set
    in the User table. If a user is removed, their read permission and assignment are also revoked.
    """
    # ? IF DOCUMENT IS NOT NEW THAT TIME ONLY RUN THIS SCRIPT
    if not doc.is_new():
        # users = doc.documents_and_deliverables

        # ? GET LIST OF ALL CURRENT USER SETTED IN THE CHILD TABLE
        current_users = {row.get("provided_by") for row in doc.get("documents_and_deliverables", []) if
                         row.get("provided_by")}

        if doc.get("opportunity_coowner"):
            current_users.add(doc.opportunity_coowner)

        if doc.get("opportunity_owner"):
            current_users.add(doc.opportunity_owner)

        # ? GET A LIST OF ALL open STATUS TODO(ASSIGNMENTS) FOR THIS PARTICULAR DOCUMENT
        assigned_todos = frappe.get_all(
            "ToDo",
            filters={
                "reference_type": "Tender Opportunity",
                "reference_name": doc.name,
                "status": "Open",
            },
            fields=["name", "allocated_to"],
        )

        # ? GET ALL DOCUMENT SHARE FOR THIS CURRENT DOCUMENT (PERMISSIONS WE GIVEN IN THE SIDEBAR)
        shared_users = frappe.get_all(
            "DocShare",
            filters={
                "share_doctype": "Tender Opportunity",
                "share_name": doc.name,
            },
            fields=["name", "user"],
        )

        # ? REMOVE ASSIGNED IF USER IS NOT AVAILABLE IN THE USER CHILD TABLE
        for todo in assigned_todos:
            # ? VALIDATE THE USER IS AVAILABLE OR NOT IN THE USERLIST
            if todo.allocated_to not in current_users:
                frappe.delete_doc(
                    "ToDo", todo.name, force=True, ignore_permissions=True
                )

        # ? REMOVE SHARE PERMISSIONS IF USER IS NOT AVAILABLE IN THE USER CHILD TABLE
        for share in shared_users:
            if share.user not in current_users:
                frappe.delete_doc(
                    "DocShare", share.name, force=True, ignore_permissions=True
                )

        # ? AUTO ASSIGN AND SHARE TO USER IF USER IS ADD IN USER CHILD TABLE
        for user in current_users:
            # user = user.provided_by

            # ? CHECK OPEN TODO(ASSIGNMENT) ALREADY EXISTS OR NOT BASED ON THE OPEN STATUS
            existing_todo = frappe.db.get_value(
                "ToDo",
                {
                    "allocated_to": user,
                    "reference_type": "Tender Opportunity",
                    "reference_name": doc.name,
                    "status": "Open",
                },
                "name",
            )
            # ? IF NOT EXISTS TODO(ASSIGNMENT) FOR ADDED NEW USER IN CHILD TABLE
            if not existing_todo:
                # ? create new todo(Assignment) if any open todo is not exists
                todo = frappe.new_doc("ToDo")
                todo.update(
                    {
                        "reference_type": doc.doctype,
                        "reference_name": doc.name,
                        "allocated_to": user,
                        "assigned_by": frappe.session.user,
                        "description": doc.opportunity_name,
                    }
                )
                # ? INSERT DOCUMENT
                todo.insert(ignore_permissions=True)

            # ? IF SHARE PERMISSION NOT EXISTS THATTIME ONLY RUN THIS
            if not frappe.db.exists(
                    "DocShare",
                    {"user": user, "share_doctype": "Tender Opportunity", "share_name": doc.name},
            ):
                # ? Check if the user has the TENDER ADMIN role then give all permission related Tender Opportunity
                if frappe.db.exists(
                        "Has Role", {"parent": user, "role": "Tender Admin"}
                ):
                    frappe.share.add(
                        "Tender Opportunity",
                        doc.name,
                        user,
                        read=1,
                        write=1,
                        share=1,
                        everyone=0,
                    )
                # ? IF THE USER HAS THE 'TENDER USER' ROLE, ONLY GRANT READ-ONLY ACCESS TO THE TENDER OPPORTUNITY DOCUMENT
                else:
                    frappe.share.add(
                        "Tender Opportunity",
                        doc.name,
                        user,
                        read=1,
                        write=1,
                        share=0,
                        everyone=0,
                    )
        # ? RELOAD DOC
        doc.reload()