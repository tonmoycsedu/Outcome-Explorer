$('.maininput').on('change', function(){
	console.log("text changed!")
	index = $(this).attr('id').split('_')[0];
	$("#"+index+"_mainknob").roundSlider("setValue", +(this).val())
});

$("#save_dag").on("click", function(){
	$.ajax({
        url: '/save_dag',
        data: JSON.stringify({pdag:active_model}),
        type: 'POST',
        success: function(response){
            console.log("success !!!");            
        },
        error: function(error){
            console.log("error !!!!");

        }

    });
})
$("#load_dag").on("click", function(){
	$.ajax({
        url: '/see_model',
        data: JSON.stringify({pdag_load:active_model,attrs:selected_attrs,target:target_name,model_type:model_type}),
        type: 'POST',
        success: function(response){
            console.log("success !!!");
            //active_model = JSON.parse(response.model);
            active_density = Object.values(response.histogram)
            feasibility_chart("#feasibility_bars",active_density)
            update_network(JSON.parse(response.model));
            
        },
        error: function(error){
            console.log("error !!!!");
        }
    });
})

$("body").on("click","#save_state", function(){
    insert_state()
})

// $("#load_dag").on("click", function(){
//     $.ajax({
//         url: '/load_dag',
//         type: 'POST',
//         success: function(response){
//             console.log("success !!!");
//             // active_model = JSON.parse(response.model);
//             // active_density = Object.values(response.histogram)
//             // feasibility_chart("#feasibility_bars",active_density)
//             update_network(JSON.parse(response.model));
            
//         },
//         error: function(error){
//             console.log("error !!!!");
//         }
//     });
// })

$("#load_cfa_modal").on("click", function(){
    $('#latent_modal')
        .modal('show')
    ;
})

$("#load_desc_modal").on("click", function(){
    $('#desc_modal')
        .modal('show')
    ;
})

$("body").on("change","#show_axis",function(){
    console.log("checked??")
    if(this.checked){
        $(".axis").show()
        $(".axis_labels").show()    
        show_axis = true
    }
    else{
        $(".axis").hide()
        $(".axis_labels").hide()
        show_axis = false
    }
})

$("#school_category").on("change",function(){
    school_category = this.value;
    feasibility_score()
})

$("#cfa_go").on("click", function(){
    indicators = []
    len = active_model.nodes.length
    f_name = $("#cfa_name").val()
    arr = $.grep(active_model.nodes, function( node, i ) {
      return ( node.name == f_name );
    });
    console.log(arr)
    $('.indicator:checkbox:checked').each(function(){
        name = $(this).val()
        i = find_nodeId(name)
        indicators.push(name)
        if(!arr.length)
            active_model.links.push({"source":i,"target":len,"direct_type":"Directed","beta":+$(".corr#"+name).val()})
        else
            active_model.links.push({"source":i,"target":arr[0].id,"direct_type":"Directed","beta":+$(".corr#"+name).val()})
    })
    // console.log(f_name)
    if(!arr.length)
        active_model.nodes.push({"id":len,"name":f_name,"data_type":"Latent","causes":indicators})
    else{
        target_node = active_model.nodes[arr[0].id]
        $.each(indicators,function(i,val){
            target_node.causes.push(val)
        })
    }
    // console.log(active_model)
    update_network(active_model);
    $("#factor_body").append('<tr><td><div class="ui checkbox">'+
                                '<input type="checkbox" class="indicator" value="'+f_name+'">'+
                                '<label>'+f_name+'</label></div></td>'+
                             '<td><div class="ui mini input">'+
                                '<input id="'+f_name+'" type="number" class="corr"></div></td></tr>')
})
