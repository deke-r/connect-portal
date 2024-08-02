$(function () {
  $("#datepicker").datepicker({
    dateFormat: 'dd-mm-yy',
    onSelect: function (selectedDate) {
      var startDate = $(this).datepicker('getDate');

      var sc = document.getElementById('datepicker').value


      startDate.setDate(startDate.getDate() + 1);
      $("#datepicker2").datepicker("option", "minDate", startDate);
      var endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 90);
      $("#datepicker2").datepicker("option", "maxDate", endDate);
    }
  });

  $("#datepicker2").datepicker({
    dateFormat: 'dd-mm-yy',
  });
});





function formatDate(date) {
  return moment(date).format('DD-MM-YYYY');
}

$(document).ready(function () {
<<<<<<< HEAD
 // Function to sort data by rc_id in ascending order
 function sortDataByRcIdAscending(data) {
  data.sort((a, b) => a.rc_id - b.rc_id);
}


=======
>>>>>>> ed83d7165492aeec5271d205ce0189f2a1084730
  $(document).on('click', '#evt_run', function () {
    const sd = $('#datepicker').val();
    const ed = $('#datepicker2').val();
    const evtc = $('#evtc').val();
    var userInput = $('#searchInput').val().trim();

    if (!sd || !ed) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Please Select Start Date & End Date!',
      });
      return;
    }

    $('#loader-div').removeClass('d-none')

    $.ajax({
      method: 'POST',
      url: '/filter_event_report',
      data: { sd: sd, ed: ed, evtc: evtc, userInput: userInput },
      success: function (res) {
        $('#loader-div').addClass('d-none');
        console.log(res);
        $('#tbody').empty();
        $('#thead').empty();
        let headerAppended = false;
        let emp_idd = res.emp;

        if (res.data.length === 0) {
          Swal.fire({
            icon: 'info',
            title: 'No Records Found',
            text: 'No records match the specified criteria.',
          });
        } else {
<<<<<<< HEAD
          sortDataByRcIdAscending(res.data);
          
=======
>>>>>>> ed83d7165492aeec5271d205ce0189f2a1084730
          console.log(res.data);
          for (let i = 0; i < res.data.length; i++) {
            let rowData = res.data[i];
            let emp_name = rowData.EMP_NAME;
            let rep_manager_id = rowData.REP_MANAGER_ID;
            let rep_manager_name = rowData.REP_MANAGER_NAME;
            let branch = rowData.BRANCH;
            let zone = rowData.ZONE;
<<<<<<< HEAD
            let hqname=rowData.EMP_HQ_NAME;
            let hqcode=rowData.EMP_HQ_CODE;
=======
>>>>>>> ed83d7165492aeec5271d205ce0189f2a1084730
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
<<<<<<< HEAD
            let pay_advance = rowData.pay_advance;
=======
>>>>>>> ed83d7165492aeec5271d205ce0189f2a1084730

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

                if (!headerAppended) {
                  $('#thead').html(`<tr>
                                  <th class='stickyhead1'>ID</th>
                                  <th class='stickyhead2'>Branch</th>
                                  <th>Zone</th>
                                  <th>Emp Id</th>
                                  <th>Employee</th>
<<<<<<< HEAD
                                    <th>HQ Name</th>
                                  <th>HQ Code</th>
=======
>>>>>>> ed83d7165492aeec5271d205ce0189f2a1084730
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
<<<<<<< HEAD
                                   <th>Advance(Rs.)</th>
=======
>>>>>>> ed83d7165492aeec5271d205ce0189f2a1084730
                                  <th>Expense (Rs.)</th>
                                  <th>Vertical</th>
                                  <th>Meeting Gift</th>
                                  <th>Meet Status</th>
                                  </tr>`);
                  headerAppended = true;
                }

                let rowBackground = '';
                if (is_active_text[0] === 'Rejected By Your Manager' || is_active_text[0] === 'Rejected By Commercial Team') {
                  rowBackground = 'color: #cc0001 !important;'
                }

                let rowDataHtml = `<tr>
                                  <td class='stickybody1' style="${rowBackground}"><a class='' id='' target="_blank" href='/event_report_pdf/${emp_id}/${rc_id}/${meetTypeText}'>${rc_id}</a></td>
                                  <td class='stickybody2' style="${rowBackground}">${branch}</td>
                                  <td style="${rowBackground}">${zone}</td>
                                  <td style="${rowBackground}">${emp_id}</td>
                                  <td style="${rowBackground}">${emp_name}</td>
<<<<<<< HEAD
                                  <td style="${rowBackground}">${hqname}</td>
                                  <td style="${rowBackground}">${hqcode}</td>
=======
>>>>>>> ed83d7165492aeec5271d205ce0189f2a1084730
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
<<<<<<< HEAD
                                   <td style="${rowBackground}">${pay_advance}</td>
=======
>>>>>>> ed83d7165492aeec5271d205ce0189f2a1084730
                                  <td style="${rowBackground}">${Expense}</td>
                                  <td style="${rowBackground}">${vertical}</td>
                                  <td style="${rowBackground}">${meeting_gift}</td>
                                  <td style="${rowBackground}">${is_active_text}</td>
                              </tr>`;
                $('#tbody').append(rowDataHtml);
              },
              error: function (error) {
                console.error(error);
              }
            });
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
                    let cellText = $(this).text().replace(/[";]/g, ''); // Remove unwanted characters
                    return cellText.includes(',') ? '"' + cellText + '"' : cellText;
                }).get();
                // Join row data with commas, and replace newline characters with a space
                csvContent += row.join(",").replace(/\n/g, ' ') + "\n";
            });
            
            let encodedUri = encodeURI(csvContent);
            let link = document.createElement("a");
            link.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent));
            link.setAttribute("download", "event_report" + emp_idd + ".csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
        

        }
      },
      error: function (error) {
        console.error(error);
      }
    });
  });

  
});








$(document).on('click', '#reset', function () {
  window.location.reload()
})


$(document).on('click', '#export_pdf', function () {
  window.print()
})













