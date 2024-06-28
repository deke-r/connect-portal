$(document).on('click','#search',function(){
    $('#dataTables').removeClass('d-none')
    $('#tbody').append(`
    <tr>
        <td class="text-center">
            <i class="fa-solid fa-pen-to-square f_16" id="edit_row"></i>
        </td>
        <td>24135</td>
        <td>[GST-Name Error]</td>
        <td>OC35026</td>
        <td>kitchen N More</td>
        <td>Welcome 1300 - 2599</td>
        <td>1300</td>
        <td>PJB & JK</td>
        <td>PUNJAB</td>
        <td>Amritsar Upcountry</td>
        <td>Sahil Arora</td>
        <td>70494</td>
        <td>MANPREET HARDWARE STORE</td>
        <td>DAM082</td>
        <td>CS ARORA</td>
        <td>9356004465</td>
        <td>10-02-2024 19:12:12	</td>
        <td><i class="fa-solid fa-trash f_16" id="delete_row"></i></td>
    </tr>
    `)
})

$(document).on('click', '#delete_row', function() {
    $(this).closest('tr').remove();
});

// modal open function
$(document).on('click', '#edit_row', function() {
    $('#editModal').modal('show');
});
