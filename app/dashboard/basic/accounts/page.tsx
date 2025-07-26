"use client";

import { useEffect } from "react";
import $ from "jquery";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function AccountsPage() {
  useEffect(() => {
    const apiUrl = "http://149.102.143.102:8000/api/accounts_list";
    const createAccountApi = "http://149.102.143.102:8000/api/api_create_account";
    let allAccounts: any[] = [];
    let selectedAccountId: number | null = null;
    let currentTreeItem: JQuery<HTMLElement> | null = null;
    let selectedParentId: number | null = null;
    let currencies: any[] = [];

    function generateAccountId(parentId: number | null) {
      const parentAccount = allAccounts.find((a) => a.id === parentId);
      const parentAccId = parentAccount ? parentAccount.acc_id : "";

      if (parentAccount && parentAccount.acc_level >= 5) {
        alert("لا يمكن إضافة حسابات جديدة تحت المستوى الخامس.");

        return null;
      }
      const siblings = allAccounts.filter((a) => a.parent === parentId);
      const siblingCount = siblings.length;

      if (parentAccount && parentAccount.acc_level < 5 && siblingCount >= 9) {
        alert("لا يمكن إضافة أكثر من 9 حسابات في هذا المستوى.");

        return null;
      }
      let newSuffix;

      if (parentAccount && parentAccount.acc_level < 4) {
        newSuffix = siblingCount + 1;
      } else if (parentAccount && parentAccount.acc_level === 4) {
        const siblingNumbers = siblings.map(
          (s) => parseInt(s.acc_id.substring(parentAccId.length)) || 0,
        );

        newSuffix = Math.max(...siblingNumbers, 0) + 1;
        newSuffix = newSuffix.toString().padStart(4, "0");
      } else {
        newSuffix = siblingCount + 1;
      }

      return `${parentAccId}${newSuffix}`;
    }

    function buildTreeView(
      accounts: any[],
      parentId: number | null,
      container: JQuery<HTMLElement>,
    ) {
      if (parentId === null) {
        const rootItem = $("<li>");
        const rootSpan = $("<span>")
          .text("دليل الحسابات")
          .attr("tabindex", "0")
          .addClass("active")
          .on("click", function () {
            $("#treeview span").removeClass("active");
            $(this).addClass("active");
            selectedAccountId = 0;
            showChildAccounts(null);
          });

        rootItem.append(rootSpan);
        const rootContainer = $("<ul>").addClass("visible").appendTo(rootItem);

        container.append(rootItem);
        buildTreeView(accounts, 0, rootContainer);

        return;
      }
      accounts
        .filter((a) =>
          parentId === 0 ? a.parent === null : a.parent === parentId,
        )
        .forEach((account) => {
          const li = $("<li>");
          const span = $("<span>")
            .text(account.acc_name)
            .attr("data-id", account.id)
            .attr("tabindex", "0")
            .on("click", function () {
              $("#treeview span").removeClass("active");
              $(this).addClass("active");
              selectedAccountId = account.id;
              showChildAccounts(account.id);
            })
            .on("dblclick", function () {
              previewAccount(account);
            });

          li.append(span);
          const childAccounts = accounts.filter((a) => a.parent === account.id);

          if (childAccounts.length > 0) {
            const childContainer = $("<ul>").hide().appendTo(li);

            buildTreeView(accounts, account.id, childContainer);
            span.on("click", function (e) {
              e.stopPropagation();
              const isVisible = childContainer.is(":visible");

              childContainer.slideToggle(300);
              span.parent().toggleClass("expanded", !isVisible);
            });
          }
          container.append(li);
        });
    }

    $("#treeview").on("click", "span", function () {
      selectedParentId = $(this).data("id");
    });

    function showChildAccounts(parentId: number | null) {
      const detailsBody = $("#account-details");

      detailsBody.empty();
      const childAccounts = allAccounts.filter((a) => a.parent === parentId);

      if (childAccounts.length === 0) {
        detailsBody.append(
          $("<tr>").append(
            $("<td>")
              .attr("colspan", 6)
              .addClass("text-center")
              .text("لا توجد حسابات فرعية"),
          ),
        );

        return;
      }
      childAccounts.forEach((account) => {
        const row = $("<tr>");

        row.append($("<td>").text(account.acc_id));
        row.append($("<td>").text(account.acc_name));
        row.append(
          $("<td>").text(
            account.acc_rep === 1 ? "الأرباح والخسائر" : "الميزانية العمومية",
          ),
        );
        row.append($("<td>").text(account.acc_type === 1 ? "رئيسي" : "فرعي"));
        const currency = currencies.find(
          (cur) => String(cur.id) === String(account.cur),
        );

        row.append($("<td>").text(currency ? currency.cur_name : "غير محددة"));
        const actionsCell = $("<td>");
        const editButton = $("<button>")
          .addClass("btn btn-sm")
          .css("color", "gray")
          .html('<i class="fas fa-edit"></i>')
          .on("click", function () {
            editAccount(account);
          });
        const viewButton = $("<button>")
          .addClass("btn btn-sm")
          .css("color", "#41A5EE")
          .html('<i class="fas fa-eye"></i>')
          .on("click", function () {
            previewAccount(account);
          });
        const deleteButton = $("<button>")
          .addClass("btn btn-sm")
          .css("color", "red")
          .html('<i class="fas fa-trash"></i>')
          .on("click", function () {
            deleteAccount(account.id);
          });

        actionsCell.append(editButton).append(viewButton).append(deleteButton);
        row.append(actionsCell);
        detailsBody.append(row);
      });
    }

    async function addAccount() {
      const newAccount = {
        acc_id: $("#accountId").val(),
        acc_name: $("#accountName").val(),
        acc_name_e: ($("#accountNameE").val() as any) || "Unnamed Account",
        acc_type: parseInt($("#accountType").val() as any),
        parent: $("#accountParent").val()
          ? parseInt($("#accountParent").val() as any)
          : null,
        acc_kind: parseInt($("#accountKind").val() as any) || 1,
        acc_rep: parseInt($("#accountRep").val() as any) || 1,
        acc_digit: parseInt($("#accountDigit").val() as any) || 4,
        acc_priv: parseInt($("#accountPriv").val() as any) || 1,
        acc_cat: parseInt($("#accountCat").val() as any) || 1,
        acc_notes: $("#accountNotes").val() || "",
        acc_vat: $("#accountVat").val() || "0%",
        cur: parseInt($("#accountCurrency").val() as any) || 1,
        acc_level: parseInt($("#accountLevel").val() as any),
      } as any;

      try {
        const response = await fetch(createAccountApi, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newAccount),
        });

        if (!response.ok) {
          const errorData = await response.json();

          alert(
            `حدث خطأ أثناء إضافة الحساب: ${errorData.message || "تفاصيل غير معروفة"}`,
          );
        } else {
          alert("تمت إضافة الحساب بنجاح");
          ("#addAccountModal" as any).modal("hide");
          if (newAccount.parent) {
            showChildAccounts(newAccount.parent);
          } else {
            fetchAccounts();
          }
        }
      } catch (error) {
        alert("حدث خطأ أثناء الاتصال بالخادم.");
      }
    }

    async function fetchAccounts() {
      try {
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = await response.json();

          alert(`خطأ: ${errorData.message || "تفاصيل غير معروفة"}`);

          return;
        }
        allAccounts = await response.json();
        $("#treeview").empty();
        const treeRoot = $("<ul>").addClass("visible").appendTo("#treeview");

        buildTreeView(allAccounts, null, treeRoot);
        populateParentDropdown();
      } catch (error) {
        alert("خطأ في الاتصال بالخادم. تحقق من الرابط أو الإعدادات.");
      }
    }

    function populateParentDropdown() {
      const dropdown = $("#accountParent");

      dropdown.empty();
      dropdown.append('<option value="">لا يوجد</option>');
      allAccounts.forEach((account) => {
        dropdown.append(
          `<option value="${account.id}">${account.acc_name}</option>`,
        );
      });
    }

    async function editAccount(account: any) {
      selectedAccountId = account.id;
      $("#accountId").val(account.acc_id);
      $("#accountName").val(account.acc_name);
      $("#accountNameE").val(account.acc_name_e);
      $("#accountType").val(account.acc_type);
      $("#accountParent").val(account.parent || "");
      $("#accountKind").val(account.acc_kind);
      $("#accountRep").val(account.acc_rep);
      $("#accountDigit").val(account.acc_digit);
      $("#accountPriv").val(account.acc_priv);
      $("#accountCat").val(account.acc_cat);
      $("#accountNotes").val(account.acc_notes || "");
      $("#accountVat").val(account.acc_vat || "");
      $("#accountCurrency").val(account.cur);
      $("#addAccountModal").modal("show");
    }

    async function deleteAccount(id: number) {
      if (!confirm("هل أنت متأكد أنك تريد حذف هذا الحساب؟")) return;
      try {
        const response = await fetch(
          `http://149.102.143.102:8000/api/api_delete_account/${id}`,
          { method: "DELETE" },
        );

        if (!response.ok) {
          const errorData = await response.json();

          alert(
            `حدث خطأ أثناء حذف الحساب: ${errorData.message || "تفاصيل غير معروفة"}`,
          );

          return;
        }
        alert("تم حذف الحساب بنجاح");
        fetchAccounts();
      } catch (err) {
        alert("خطأ في الاتصال بالخادم");
      }
    }

    function previewAccount(account: any) {
      selectedAccountId = account.id;
      $("#accountId").val(account.acc_id).prop("readonly", true);
      $("#accountName").val(account.acc_name).prop("readonly", true);
      $("#accountNameE").val(account.acc_name_e).prop("readonly", true);
      $("#accountType").val(account.acc_type).prop("disabled", true);
      $("#accountParent")
        .val(account.parent || "")
        .prop("disabled", true);
      $("#accountKind").val(account.acc_kind).prop("readonly", true);
      $("#accountRep").val(account.acc_rep).prop("disabled", true);
      $("#accountDigit").val(account.acc_digit).prop("readonly", true);
      $("#accountPriv").val(account.acc_priv).prop("readonly", true);
      $("#accountCat").val(account.acc_cat).prop("readonly", true);
      $("#accountNotes")
        .val(account.acc_notes || "")
        .prop("readonly", true);
      $("#accountVat")
        .val(account.acc_vat || "")
        .prop("readonly", true);
      $("#accountCurrency").val(account.cur).prop("readonly", true);
      $("#accountLevel").val(account.acc_level).prop("readonly", true);
      $("#editAccountButton").show();
      $("#saveAccountButton").hide();
      $("#modalTitle").text("عرض تفاصيل الحساب");
      $("#addAccountModal").modal("show");
    }

    function enableEditMode() {
      $("#accountId").prop("readonly", false);
      $("#accountName").prop("readonly", false);
      $("#accountNameE").prop("readonly", false);
      $("#accountType").prop("disabled", false);
      $("#accountParent").prop("disabled", false);
      $("#accountKind").prop("readonly", false);
      $("#accountRep").prop("disabled", false);
      $("#accountDigit").prop("readonly", false);
      $("#accountPriv").prop("readonly", false);
      $("#accountCat").prop("readonly", false);
      $("#accountNotes").prop("readonly", false);
      $("#accountVat").prop("readonly", false);
      $("#accountCurrency").prop("readonly", false);
      $("#accountLevel").prop("readonly", false);
      $("#editAccountButton").hide();
      $("#saveAccountButton").show();
      $("#modalTitle").text("تعديل الحساب");
    }

    async function fetchCurrencies() {
      try {
        const response = await fetch(
          "http://149.102.143.102:8000/api/currencies_list/",
        );

        if (!response.ok) throw new Error();
        currencies = await response.json();
        const currencySelect = $("#accountCurrency");

        currencySelect.empty();
        currencies.forEach((c) => {
          currencySelect.append(
            `<option value="${c.id}">${c.cur_name}</option>`,
          );
        });
      } catch (err) {
        alert("حدث خطأ أثناء جلب بيانات العملات.");
      }
    }

    $(document).ready(function () {
      fetchCurrencies().then(() => {
        fetchAccounts();
      });
      $("#addAccountButton").on("click", function () {
        $("#modalTitle").text("إضافة حساب جديد");
        ($("#addAccountForm")[0] as HTMLFormElement).reset();
        if (selectedAccountId) {
          const parentAccount = allAccounts.find(
            (a) => a.id === selectedAccountId,
          );

          if (parentAccount && parentAccount.acc_level >= 5) {
            alert("لا يمكن إضافة حسابات جديدة تحت المستوى الخامس.");

            return;
          }
          $("#accountParent").val(selectedAccountId);
          if (parentAccount)
            $("#accountLevel").val(parentAccount.acc_level + 1);
          else $("#accountLevel").val(1);
        } else {
          $("#accountParent").val("");
          $("#accountLevel").val(1);
        }
        $("#addAccountModal").modal("show");
      });
      $("#saveAccountButton").on("click", addAccount);
    });
  }, []);

  return (
    <>
      <style>{`
        .treeview {font-family: JannaLT; position: relative; overflow: hidden;}
        .treeview ul {list-style: none; padding-left: 25px; margin: 0; position: relative;}
        .treeview ul::before {content:""; position:absolute; top:0; bottom:0; left:12px; width:2px; background:#ccc;}
        .treeview li {position: relative; padding-left:25px; margin-bottom:10px;}
        .treeview li::before {content:""; position:absolute; top:12px; left:0; width:20px; height:2px; background:#ccc;}
        .treeview span {display:inline-flex; align-items:center; cursor:pointer; padding:6px -1px; background-color:transparent; color:#333; transition:all 0.3s ease;}
        .treeview span:hover {background-color:#f0f0f0; color:#000;}
        .treeview li > span::before {content:"▶"; font-size:9px; margin-right:5px; cursor:pointer; display:inline-block; transform:rotate(0deg); transition:transform 0.3s ease;}
        .treeview li.expanded > span::before {transform:rotate(90deg);}
        .modal-lg {max-width:90%; height:80%;}
        .modal-body {font-family:JannaLT; max-height:70vh; overflow-y:auto;}
        .form-container {display:flex; flex-wrap:wrap; gap:20px; justify-content:space-between;}
        .form-group {flex:1 1 calc(25% - 20px);}
        .wide-field {flex:1 1 calc(50% - 20px);}
        .medium-field {flex:1 1 calc(33% - 20px);}
        .small-field {flex:1 1 calc(20% - 20px);}
        .switch-field {flex:1 1 100%; text-align:center; font-size:1.2rem;}
        .form-control, .form-select, .form-check-label {font-size:1.1rem; padding:10px;}
        textarea.form-control {resize:none;}
      `}</style>
      <div className="container mt-5">
        <div className="row">
          <div className="col-md-4">
            <div className="input-group mb-3">
              <input
                className="form-control"
                id="searchBox"
                placeholder="بحث عن حساب"
                type="text"
              />
            </div>
            <button
              className="btn btn-success mb-3 w-100"
              id="addAccountButton"
            >
              إضافة حساب جديد
            </button>
            <div className="treeview border p-3" id="treeview" />
          </div>
          <div className="col-md-8">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>رقم الحساب</th>
                  <th>اسم الحساب</th>
                  <th>التقرير</th>
                  <th>نوع الحساب</th>
                  <th>العملة</th>
                  <th />
                </tr>
              </thead>
              <tbody id="account-details">
                <tr>
                  <td className="text-center" colSpan={6}>
                    اختر حسابًا من الشجرة
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="modal" id="addAccountModal" tabIndex={-1}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="modalTitle">
                إضافة حساب جديد
              </h5>
              <button
                aria-label="Close"
                className="btn-close"
                data-bs-dismiss="modal"
                type="button"
              />
            </div>
            <div className="modal-body">
              <form id="addAccountForm">
                <div className="form-container">
                  <div className="form-group small-field">
                    <label htmlFor="accountId">رقم الحساب</label>
                    <input
                      readOnly
                      className="form-control"
                      id="accountId"
                      type="text"
                    />
                  </div>
                  <div className="form-group wide-field">
                    <label htmlFor="accountName">اسم الحساب</label>
                    <input
                      className="form-control"
                      id="accountName"
                      type="text"
                      required
                    />
                  </div>
                  <div className="form-group wide-field">
                    <label htmlFor="accountNameE">
                      اسم الحساب (بالإنجليزية)
                    </label>
                    <input
                      className="form-control"
                      id="accountNameE"
                      type="text"
                    />
                  </div>
                  <div className="form-group wide-field">
                    <label htmlFor="accountParent">الحساب الأب</label>
                    <select className="form-select" id="accountParent">
                      <option value="">لا يوجد</option>
                    </select>
                  </div>
                  <div className="form-group medium-field">
                    <label htmlFor="accountType">نوع الحساب</label>
                    <select className="form-select" id="accountType">
                      <option value="1">رئيسي</option>
                      <option value="2">فرعي</option>
                    </select>
                  </div>
                  <div className="form-group medium-field">
                    <label htmlFor="accountKind">طبيعه الحساب</label>
                    <select className="form-select" id="accountKind">
                      <option value="1">مدين</option>
                      <option value="2">دائن</option>
                    </select>
                  </div>
                  <div className="form-group medium-field">
                    <label htmlFor="accountRep">تقرير الحساب</label>
                    <select className="form-select" id="accountRep">
                      <option value="1">الأرباح والخسائر</option>
                      <option value="2">الميزانية العمومية</option>
                    </select>
                  </div>
                  <div className="form-group medium-field">
                    <label htmlFor="accountDigit">عدد الخانات</label>
                    <input
                      className="form-control"
                      defaultValue={4}
                      id="accountDigit"
                      type="number"
                    />
                  </div>
                  <div className="form-group medium-field">
                    <label htmlFor="accountPriv">صلاحيات الحساب</label>
                    <input
                      className="form-control"
                      defaultValue={1}
                      id="accountPriv"
                      type="number"
                    />
                  </div>
                  <div className="form-group medium-field">
                    <label htmlFor="accountCat">فئة الحساب</label>
                    <input
                      className="form-control"
                      defaultValue={1}
                      id="accountCat"
                      type="number"
                    />
                  </div>
                  <div className="form-group medium-field">
                    <label htmlFor="accountLevel">مستوى الحساب</label>
                    <input
                      className="form-control"
                      id="accountLevel"
                      type="number"
                    />
                  </div>
                  <div className="form-group medium-field">
                    <label htmlFor="accountVat">القيمة المضافة</label>
                    <input
                      className="form-control"
                      id="accountVat"
                      type="text"
                    />
                  </div>
                  <div className="form-group medium-field">
                    <label htmlFor="accountCurrency">العملة</label>
                    <select className="form-select" id="accountCurrency" />
                  </div>
                  <div className="form-group medium-field">
                    <label htmlFor="accountNotes">ملاحظات</label>
                    <input
                      className="form-control"
                      id="accountNotes"
                      type="text"
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                id="editAccountButton"
                style={{ display: "none" }}
                type="button"
                onClick={() => enableEditMode()}
              >
                تعديل
              </button>
              <button
                className="btn btn-primary"
                id="saveAccountButton"
                type="button"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
