$(function () {
  $("#datepicker").datepicker({
    dateFormat: 'dd-mm-yy',
    onSelect: function (selectedDate) {
      var startDate = $(this).datepicker('getDate');
      startDate.setDate(startDate.getDate() + 1);
      $("#datepicker2").datepicker("option", "minDate", startDate);
      var endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 60);
      $("#datepicker2").datepicker("option", "maxDate", endDate);
    }
  });

  $("#datepicker2").datepicker({
    dateFormat: 'dd-mm-yy',
  });
});






$(document).ready(function () {
  $(document).on('click', '#evt_run', function () {
    const sd = $('#datepicker').val();
    const ed = $('#datepicker2').val();
    var userInput = $('#searchInput').val().trim();

    if (!sd || !ed) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Please Select Start Date & End Date!',
      });
      return;
    }

    $('#loader-div').removeClass('d-none');
    $.ajax({
      method: 'POST',
      url: '/filter_detail_event',
      data: { sd: sd, ed: ed, userInput: userInput },
      success: function (res) {
        $('#loader-div').addClass('d-none');
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
            let rowData = res.data[i];
            let emp_name = rowData.EMP_NAME;
            let rep_manager_id = rowData.REP_MANAGER_ID;
            let rep_manager_name = rowData.REP_MANAGER_NAME;
            let branch = rowData.BRANCH;
            let zone = rowData.ZONE;
            let hqname=rowData.EMP_HQ_NAME;
            let hqcode=rowData.EMP_HQ_CODE;
            let rc_id = rowData.rc_id;
            let emp_id = rowData.emp_id;
            let DateOfMeet = formatDate(rowData.DateOfMeet);
            let Dealer_Code = rowData.Dealer_Code;
            let Dealer_firm_Name = rowData.Dealer_firm_Name;
            let Dealer_Name = rowData.Dealer_Name;
            let City = rowData.City;
            let Agenda = rowData.Agenda;
            let Jacpl_Attended = rowData.Jacpl_Attended;
            let Cond_By = rowData.Cond_By;
            let Outcome = rowData.Outcome;
            let MobileAttended = rowData.MobileAttended;
            let mobileNumbers = MobileAttended.split(',');
            let mobileCount = mobileNumbers.length;
            let Meet_Type = rowData.Meet_Type;
            let Budget = rowData.Budget;
            let Expense = rowData.Expense;
            let vertical = rowData.vertical;
            let meeting_gift = rowData.meeting_gift;
            let is_active = rowData.is_active;

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

            $.ajax({
              method: 'POST',
              url: '/is_active_status',
              data: { is_active: is_active },
              success: function (statusRes) {
                let is_active_text = statusRes.actionStatus;

                let data = '';
                for (let k = 0; k < res.data1[i].length; k++) {
                  let mobileNumber = res.data1[i][k].Inf_Mobile;
                  let Inf_Name = res.data1[i][k].Inf_Name;
                  let Inf_Status = res.data1[i][k].Inf_Status;
                  let Inf_Type = res.data1[i][k].Inf_Type;


                  let rowBackground = '';
                          if (is_active_text[0] === 'Rejected By Your Manager' || is_active_text[0] === 'Rejected By Commercial Team') {
                            rowBackground = 'color: #cc0001 !important;'
                          }

                  data += `<tr>
                    <td class='stickybody1 fw-bold' style="${rowBackground}">${rc_id}</td>
                    <td class='stickybody2' style="${rowBackground}">${branch}</td>
                    <td style="${rowBackground}">${zone}</td>
                    <td style="${rowBackground}">${emp_id}</td>
                    <td style="${rowBackground}">${emp_name}</td>
                     <td style="${rowBackground}">${hqname}</td>
                    <td style="${rowBackground}">${hqcode}</td>
                    <td style="${rowBackground}">${rep_manager_id}</td>
                    <td style="${rowBackground}">${rep_manager_name}</td>
                    <td style="${rowBackground}">${meetTypeText}</td>
                    <td style="${rowBackground}">${DateOfMeet}</td>
                    <td style="${rowBackground}">${Dealer_Code}</td>
                    <td style="${rowBackground}">${Dealer_Name}</td>
                    <td style="${rowBackground}">${Dealer_firm_Name}</td>
                    <td style="${rowBackground}">${City}</td>
                    <td style="${rowBackground}">${Agenda}</td>
                    <td style="${rowBackground}">${mobileCount}</td>
                    <td style="${rowBackground}">${Outcome}</td>
                    <td style="${rowBackground}">${Cond_By}</td>
                    <td style="${rowBackground}">${Jacpl_Attended}</td>
                    <td style="${rowBackground}">${Budget}</td>
                    <td style="${rowBackground}">${Expense}</td>
                    <td style="${rowBackground}">${mobileNumber}</td>
                    <td style="${rowBackground}">${Inf_Name}</td>
                    <td style="${rowBackground}">${Inf_Status}</td>
                    <td style="${rowBackground}">${Inf_Type}</td>
                    <td style="${rowBackground}">${vertical}</td>
                    <td style="${rowBackground}">${meeting_gift}</td>
                    <td style="${rowBackground}">${is_active_text}</td>
                  </tr>`;
                }

                $('#tbody').append(data);

                if (!headerAppended) {
                  $('#thead').html(`<tr>
                    <th class='stickyhead1'>ID</th>
                    <th class='stickyhead2'>Branch</th>
                    <th>Zone</th>
                    <th>Emp Id</th>
                    <th>Employee</th>
                      <th>HQ Name</th>
                    <th>HQ Code</th>
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
                    <th>Influencer Mobile</th>
                    <th>Influencer Name</th>
                    <th>Influencer Status</th>
                    <th>Influencer Type</th>
                    <th>Vertical</th>
                    <th>Meeting Gift</th>
                    <th>Meet Status</th>
                  </tr>`);
                  headerAppended = true;
                }
              },
              error: function (error) {
                console.error(error);
              }
            });
          }
        }
      },
      error: function (error) {
        console.error(error);
      }
    });
  });
});


$(document).on('click', '#excel_btn', function () {
            let csvContent = "\uFEFF";
            let headers = $('#thead th').map(function () {
                let headerText = $(this).clone().children().remove().end().text();
                return headerText.replace(/[";]/g, "") || ' ';
            }).get();
            csvContent += headers.join(",") + "\n";
            $('#tbody tr').each(function () {
                let row = $(this).find('td').map(function () {
                    let cellText = $(this).text().replace(/[";]/g, ''); // Remove unwanted characters
                    return cellText.includes(',') ? '"' + cellText + '"' : cellText;
                }).get();
                // Join row data with commas, and replace newline characters with a space
                csvContent += row.join(",").replace(/\n/g, ' ') + "\n";
            });
            let encodedUri = encodeURI(csvContent);
            let link = document.createElement("a");
            link.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent));
            link.setAttribute("download", "details_event_report.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });


$(document).on('click', '#reset', function () {
  window.location.reload()
})
function formatDate(date) {
  return moment(date).format('DD-MM-YYYY');
}
