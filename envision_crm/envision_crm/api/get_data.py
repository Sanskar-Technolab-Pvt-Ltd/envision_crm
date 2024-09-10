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


@frappe.whitelist()
def get_project_template_task_list(Project_template_id):
    task_list = frappe.get_all(
        "Project Template Task",
        filters={"parent": Project_template_id},
        fields=["parent", "parenttype", "task", "subject"],
    )
    # print("\n\n\n",task_list)
    organized_tasks = categorize_tasks(task_list)
    print("\n\n\n organized_tasks", organized_tasks)

    return organized_tasks


# def categorize_tasks(task_list):
#     task_mapping = {}

#     for task in task_list:
#         # Fetch the task document to check 'is_group' and 'parent_task'
#         task_doc = frappe.get_doc("Task", task["task"])

#         # If the task is a parent (is_group = 1)
#         if task_doc.is_group:
#             # Ensure the parent is in the task_mapping dictionary
#             if task_doc.name not in task_mapping:
#                 task_mapping[task_doc.name] = {
#                     "parent": task_doc.subject,
#                     "children": [],
#                 }
#         else:
#             # If the task is a child (is_group = 0), find its parent_task
#             if task_doc.parent_task:
#                 # Ensure the parent is in the task_mapping dictionary
#                 if task_doc.parent_task not in task_mapping:
#                     parent_task_doc = frappe.get_doc("Task", task_doc.parent_task)
#                     task_mapping[task_doc.parent_task] = {
#                         "parent": parent_task_doc.subject,
#                         "children": [],
#                     }

#                 # Append the child task to its parent's children list
#                 task_mapping[task_doc.parent_task]["children"].append(task_doc.name)

#     return task_mapping


@frappe.whitelist()
def categorize_tasks(task_list):
    task_mapping = {}

    for task in task_list:
        # Fetch the task document
        task_doc = frappe.get_doc("Task", task["task"])

        # If the task is a parent (is_group = 1)
        if task_doc.is_group:
            # Initialize the parent task with its subject and an empty list for children
            if task_doc.name not in task_mapping:
                task_mapping[task_doc.name] = {
                    "subject": task_doc.subject,
                    "children": [],
                }
        else:
            # If the task is a child (is_group = 0)
            if task_doc.parent_task:
                # Initialize the parent task if it doesn't exist
                if task_doc.parent_task not in task_mapping:
                    # Fetch the parent task document to get its subject
                    parent_task_doc = frappe.get_doc("Task", task_doc.parent_task)
                    task_mapping[task_doc.parent_task] = {
                        "subject": parent_task_doc.subject,
                        "children": [],
                    }

                # Append the child task as a tuple (name, subject)
                task_mapping[task_doc.parent_task]["children"].append(
                    (task_doc.name, task_doc.subject)
                )

    return task_mapping


# def categorize_tasks(task_list):
#     task_mapping = {}

#     for task in task_list:
#         # Fetch the task document
#         task_doc = frappe.get_doc("Task", task["task"])

#         # If the task is a parent (is_group = 1)
#         if task_doc.is_group:
#             # Initialize the parent task with an empty list for children
#             if task_doc.name not in task_mapping:
#                 task_mapping[task_doc.name] = []
#         else:
#             # If the task is a child (is_group = 0)
#             if task_doc.parent_task:
#                 # Initialize the parent task if it doesn't exist
#                 if task_doc.parent_task not in task_mapping:
#                     task_mapping[task_doc.parent_task] = []

#                 # Append the child task as a tuple (name, subject)
#                 task_mapping[task_doc.parent_task].append(
#                     (task_doc.name, task_doc.subject)
#                 )

#     return task_mapping


# @frappe.whitelist()
# def get_man_days_price():
#     man_days_price = frappe.get_doc(
#         "Define Man Days Price",
#         ["from_date", "to_date", "per_day_hours"],
#     )
#     print("\n\n man_days_price", man_days_price.level_wise_prices)

#     level_wise_price_list_details = frappe.get_all(
#         "Man Days Level Wise Cost",
#         filters={"parent": "Define Man Days Price"},
#         fields=["level", "amount"],
#     )
#     sorted_price_list = sorted(level_wise_price_list_details, key=lambda x: x["amount"])

#     print("\n\nSorted", sorted_price_list)
#     return{ 
#         "per_day_hours":man_days_price.per_day_hours,
#         "from_date":man_days_price.from_date,
#         "to_date":man_days_price.to_date,
#     }, sorted_price_list


@frappe.whitelist()
def get_man_days_hours():
    man_days_details = frappe.get_doc(
    "Define Man Days Price",
    ["from_date", "to_date", "per_day_hours"],
    )
    return {
    "per_day_hours": man_days_details.per_day_hours,
    "from_date": man_days_details.from_date,
    "to_date": man_days_details.to_date,
    }


@frappe.whitelist()
def get_level_wise_amount():
    level_wise_cost_details = frappe.get_all(
    "Man Days Level Wise Cost",
    filters={"parent": "Define Man Days Price"},
    fields=["level", "amount"],
    )
    sorted_cost_list = sorted(level_wise_cost_details, key=lambda x: x["amount"])
    print("\n\n", sorted_cost_list)
    return sorted_cost_list





