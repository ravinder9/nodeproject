$(document).ready(function() {


    $("#amz_cred_save").click(function(e) {

        var loaderId = document.getElementById("loaderDiv");

        var divId = document.getElementById("amzDiv");

        //var diverror = document.getElementById("error_warning");

        var spanClose = document.getElementById("close");

        var errorDiv = document.getElementById("error_warning");

        if (loaderId.style.display === "none") {
            loaderId.style.display = "block";
            divId.style.display = "none";
        }

        e.preventDefault();
        var sellerId = document.getElementsByName('sellerid')[0].value;

        if (sellerId == "") {
            alert("Please enter sellerid");
            return false;
        }

        // alert(sellerId);

        var fav = {};
        $("input:checkbox[class=setmargn]:checked").each(function() {

            var input_name[] = $(this).attr("name");
            var a = input_name.keys();
            var input_id = $(this).attr("id");
            var input_value = $(this).val();

            // console.log(input_name);

            fav[a] = input_value;

            // fav[input_name] {

            //     input_id = input_value,
            // }

            //console.log('343');

        });
        //console.log(fav[a]);
        if (JSON.stringify(fav) === '{}') {
            alert("Please select marketplace");
            return false;
        }
        alert(fav[a]);
        var secretkey = document.getElementsByName('secretkey')[0].value;
        if (secretkey == "") {
            alert("Please enter secretkey");
            return false;
        }
        var awsaccesskeyid = document.getElementsByName('awsaccesskeyid')[0].value;

        if (awsaccesskeyid == "") {
            alert("Please enter awsaccesskeyid");
            return false;
        }
        //console.log(secretkey);
        //console.log(awsaccesskeyid);


        /*if(sellerId || fav || secretkey || awsaccesskeyid == '')

        {
            alert('All the fields are mandatory');
        }*/

        $.ajax({
            type: "POST",
            dataType: "json",
            url: "/products/amazon_api", //Relative or absolute path to response.php file
            data: {
                sellerid: sellerId,
                region: fav[a],
                secretkey: secretkey,
                awsaccesskeyid: awsaccesskeyid

            },
            success: function(response) {

                //console.log('hello');



                var response_result = JSON.parse(response);

                //console.log(response_result.reportinfo.reportid);
                if (response_result.statusCode == 403) {
                    //console.log('not done') ;
                    //alert('Un authored') ;
                    //alert('please enter valid credentials');

                    $("#error_warning").text("Please enter valid credentials");

                    if (loaderId.style.display === "block") {
                        loaderId.style.display = "none";
                        divId.style.display = "block";
                        spanClose.style.display = "block";
                        errorDiv.style.display = "block";
                    }


                    /*if (spanClose.style.display === "none") {

                      spanClose.style.display = "block";
                    }*/
                    //window.location.href = '../products/amazon_form';

                } else if (response_result.statusCode == 200) {
                    //alert('done') ;
                    console.log('doneeeee');
                    //alert('You are ready to go');
                    window.location.href = '../products/show_product';


                } else {

                    alert('error');
                }


                if (response_result.reportinfo.reportid != '' || null) {
                    alert('sdfff');

                }



            },
            error: function(err) {
                console.log(err);
            }

        });







    });









});