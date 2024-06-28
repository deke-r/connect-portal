

$(function () {
    $("#datepicker").datepicker({
        dateFormat: 'dd-mm-yy',
    });

    $("#datepicker2").datepicker({
        dateFormat: 'dd-mm-yy',
    });
});


function formatDate(date) {
    return moment(date).format('DD-MM-YYYY');
}



$(document).on('click', '#mng_run', function () {



    let sd = $('#datepicker').val();
    let ed = $('#datepicker2').val();
    let ddown = $('#mng_btl').val();

    if (!sd || !ed || !ddown) {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Please Select All the fields!",
        });
    } else {

        $('#loader-div').removeClass('d-none')

        $.ajax({
            url: '/filter_view_rejected_approved_btl',
            method: 'POST',
            data: { sd: sd, ed: ed, ddown: ddown },
            success: function (res) {

                $('#loader-div').addClass('d-none')

                const emp_id = res.emp;
                $('#tbody').empty();
                $('#thead').empty();

                let headerAppended = false;

                if (res.data.length === 0) {
                    Swal.fire({
                        icon: 'info',
                        title: 'No Records Found',
                        text: 'No records match the specified criteria.',
                    });
                } else {
                    for (let i = 0; i < res.data.length; i++) {
                        let row = res.data[i];
                        let emp_name = row.EMP_NAME;
                        let rep_manager_id = row.REP_MANAGER_ID;
                        let rep_manager_name = row.REP_MANAGER_NAME;
                        let branch = row.BRANCH;
                        let rc_id = row.rc_id;
                        let emp_id = row.emp_id;
                        let DateOfMeet = formatDate(row.DateOfMeet);
                        let Dealer_Code = row.Dealer_Code;
                        let Dealer_firm_Name = row.Dealer_firm_Name;
                        let Dealer_Name = row.Dealer_Name;
                        let City = row.City;
                        let Agenda = row.Agenda;
                        let Jacpl_Attended = row.Jacpl_Attended;
                        let Cond_By = row.Cond_By;
                        let Outcome = row.Outcome;
                        let MobileAttended = row.MobileAttended;
                        let mobileNumbers = MobileAttended ? MobileAttended.split(',') : [];
                        let mobileCount = mobileNumbers.length;
                        let Meet_Type = row.Meet_Type;
                        let Budget = row.Budget;
                        let Expense = row.Expense;
                        let vertical = row.vertical;
                        let meeting_gift = row.meeting_gift;
                        let is_active = row.is_active;
                        let zone = row.Zone;
                        let company = row.Company;
                        let Session_ID = row.Session_ID;
                        let voucher_no = row.voucher_no;
                        let Rejected_Remarks = row.Rejected_Remarks;
                        let RejectedBTL_date = formatDate(row.RejectedBTL_date);
                        let ApprovedBTL_date = formatDate(row.ApprovedBTL_date);

                        let meetTypeText;

                        if (Meet_Type === 1) {
                            meetTypeText = 'In-Shop Meet';
                        } else if (Meet_Type === 2) {
                            meetTypeText = 'Contractor Meet';
                        } else if (Meet_Type === 3) {
                            meetTypeText = 'Dealer Meet';
                        } else {
                            meetTypeText = 'SGA Meet';
                        }

                        let status;
                        let remarksColumn = '';
                        let zoneCoulmn = '';
                        let CompanyCoulmn = '';
                        let VoucherCoulmn = '';
                        let ApprovedDate = '';
                        let RejectedDate = '';
                        let ApprovedBy = '';
                        let RejectedBy = '';

                        if (is_active === 2) {
                            status = 'Approved';
                            zoneCoulmn = `<th>Zone</th>`;
                            CompanyCoulmn = `<th>Company</th>`;
                            VoucherCoulmn = `<th>Voucher No</th>`;
                            ApprovedDate = `<th>Approved Date</th>`;
                            ApprovedBy = `<th>Approved By</th>`;
                        } else if (is_active === 3) {
                            status = 'Rejected';
                            remarksColumn = `<th>Rejected Remarks</th>`;
                            RejectedDate = `<th>Rejected Date</th>`;
                            RejectedBy = `<th>Rejected By</th>`;
                        } else {
                            status = 'Approval Pending';
                        }

                        if (!headerAppended) {
                            $('#thead').html(`<tr>
                                <th class='stickyhead1'>ID</th>
                                <th class='stickyhead2'>Branch</th>
                                <th>Emp Id</th>
                                <th>Employee</th>
                                <th>Sup ID</th>
                                <th>Supervisor</th>
                                <th>Category</th>
                                <th>Event Date</th>
                                <th>Dealer Code</th>
                                <th>Dealer Name</th>
                                <th>Venue</th>
                                <th>City</th>
                                <th>Agenda</th>
                                <th>People Attended</th>
                                <th>Outcome</th>
                                <th>ADE</th>
                                <th>Attended Jacpl</th>
                                <th>Budget(Rs.)</th>
                                <th>Expense (Rs.)</th>
                                <th>Vertical</th>
                                <th>Meeting Gift</th>
                                <th>Status</th>
                                ${zoneCoulmn}
                                ${CompanyCoulmn}
                                ${VoucherCoulmn}
                                ${ApprovedDate}
                                ${RejectedDate}
                                ${remarksColumn}
                                ${ApprovedBy}
                                ${RejectedBy}
                            </tr>`);
                            headerAppended = true;
                        }

                        let remarksColumnbody = '';
                        let zoneCoulmnBody = '';
                        let CompanyCoulmnBody = '';
                        let VoucherCoulmnBody = '';
                        let ApprovedDateBody = '';
                        let RejectedBTLDateBody = '';

                        if (is_active === 3) {
                            remarksColumnbody = `<td>${Rejected_Remarks}</td>`;
                            RejectedBTLDateBody = `<td>${RejectedBTL_date}</td>`;
                            Session_ID=`<td>${Session_ID}</td>`

                        } else if (is_active === 2) {
                            zoneCoulmnBody = `<td>${zone}</td>`;
                            CompanyCoulmnBody = `<td>${company}</td>`;
                            VoucherCoulmnBody = `<td>${voucher_no}</td>`;
                            ApprovedDateBody = `<td>${ApprovedBTL_date}</td>`;
                            Session_ID=`<td>${Session_ID}</td>`

                        }

                        $('#tbody').append(`<tr>
                            <td class='stickybody1'>${rc_id}</td>
                            <td class='stickybody2'>${branch}</td>
                            <td>${emp_id}</td>
                            <td>${emp_name}</td>
                            <td>${rep_manager_id}</td>
                            <td>${rep_manager_name}</td>
                            <td>${meetTypeText}</td>
                            <td>${DateOfMeet}</td>
                            <td>${Dealer_Code}</td>
                            <td>${Dealer_Name}</td>
                            <td>${Dealer_firm_Name}</td>
                            <td>${City}</td>
                            <td>${Agenda}</td>
                            <td>${mobileCount}</td>
                            <td>${Outcome}</td>
                            <td>${Cond_By}</td>
                            <td>${Jacpl_Attended}</td>
                            <td>${Budget}</td>
                            <td>${Expense}</td>
                            <td>${vertical}</td>
                            <td>${meeting_gift}</td>
                            <td>${status}</td>
                            ${zoneCoulmnBody}
                            ${CompanyCoulmnBody}
                            ${VoucherCoulmnBody}
                            ${ApprovedDateBody}
                            ${RejectedBTLDateBody}
                            ${remarksColumnbody}
                            ${Session_ID}
                        </tr>`);
                    }
                }
                $(document).on('click', '#excel_btn', function () {
                    let csvContent = "\uFEFF";

                    let headers = $('#thead th').map(function () {
                        let headerText = $(this).clone().children().remove().end().text();
                        return headerText.replace(/[";]/g, "") || ' ';
                    }).get();
                    csvContent += headers.join(",") + "\n";

                    $('#tbody tr').each(function () {
                        let row = $(this).find('td').map(function () {
                            let cellText = $(this).text().replace(/"/g, '');
                            return cellText.includes(',') ? '"' + cellText + '"' : cellText;
                        }).get();
                        csvContent += row.join(",") + "\n";
                    });

                    let encodedUri = encodeURI(csvContent);
                    let link = document.createElement("a");
                    link.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent));
                    link.setAttribute("download", "view_rejected_approved_btl" + ".csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
            },
            error: function (error) {
                console.error('Error in filter_view_rejected_approved_btl:', error);
            }
        });
    }
});






$(document).on('click', '#reset', function () {
    window.location.reload()
})