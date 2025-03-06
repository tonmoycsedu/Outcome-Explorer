// ========== Graph Visualization Components ====================================
var cg;
var on_source = true;
function load_dag(){
    
    cg = flowGraph(".causal", {
        "width": $(".causal").width(),
        "height": $(".causal").height()-80,
        "margin": { left: 40, top: 170, right: 240, bottom: 80 }
    })
    .on("node_dblclick", function(node) {
        console.log("node clicked")
        if (cg.mode() == "skel") return;
        if (on_source) {
            $source.dropdown("set selected", node.name).trigger("onChange");
            $("#srclabel").text("Source");
            $("#tarlabel").text("Target*");
        } else {
            $target.dropdown("set selected", node.name).trigger("onChange");
            $("#srclabel").text("Source*");
            $("#tarlabel").text("Target");
        }
        on_source = !on_source;
        ac.toggle(node.name);
    })
    .on("edge_dblclick", function(edge) {
        console.log("edge clicked")
        $source.dropdown("set selected", edge.source.name);
        $target.dropdown("set selected", edge.target.name).trigger("onChange");
        ac.open(edge.target.name)
            .highlight(edge.source.name, edge.target.name);
    });

}

