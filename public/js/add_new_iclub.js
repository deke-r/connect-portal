$(document).on('click','#search',function(){
    $('#dataTable').removeClass('d-none')
    $('#tbody').append(
        `<tr>
            <td class="text-center">
                <input type="radio" class="">
            </td>
            <td>
                <p class="f_13">
                    Garg Plywood ( OC1506384 ) | Club Enrolled: Not enrolled, Target(Kg): #na# | Dist : ( ) | Contact : Kamal Garg 9888072977 | Address : Gaushala road sangrur, | TE : | LFY CLUB : Bronze 2200 - 3599, LFY Achievement(KG) : 2278
                </p>
            </td>
        </tr>`
        )
})




$(document).ready(function(){
    $(document).on('click','#iclub_details',function(){
        window.location.href='/iclub_details';
    })
})

