let selectedFile = {};
let fulldata;

d3.select("#filtering").on("change", changeFilter);
d3.select("#outliers").on("change", outlierData);

changeFilter()

function changeFilter(){
    selectValueFilt = document.getElementById("filtering");
    selectedFile.filter = selectValueFilt.options[selectValueFilt.selectedIndex].value;
    let filename;
    if(selectedFile.filter == true){
        filename = "data/dfOutputYesFilt.json"}
    else{
        filename = "data/dfOutputNoFilt.json"};
    loadFiles(filename);
}

function loadFiles(filename){
    Promise.all([
        d3.json(filename)
    ]).then(showData);
}

function showData(datasources){
    
    fulldata = datasources[0];
    outlierData();
}

function outlierData(){
    
    selectValueOut = document.getElementById("outliers");
    selectedFile.outliers = selectValueOut.options[selectValueOut.selectedIndex].value;
    
    let allkeys = Object.keys(fulldata[0]);
    let outlierKeys = allkeys.filter(s => s.includes('_o'));
    let otherKeys = allkeys.filter(function(item){
        return outlierKeys.indexOf(item) === -1;
        });
    outlierKeys = outlierKeys.concat(["media", "varWin", "fitWin", "code", "profile"]);
    
    let finalKeys;
    if(selectedFile.outliers == true){
        finalKeys = outlierKeys;
    } else{ 
        finalKeys = otherKeys;
    }

    filtdata = fulldata.map(item => {
      const tmp = {}
      finalKeys.forEach(key => {
        let key2;
        if(key.includes('_o')){key2 = key.slice(0, -2)}else{key2 = key}
        tmp[key2] = item[key]
      })
      return tmp
    })
    showBars(filtdata); 
}


function showBars(alldata){
    data = [];
    for(i=0; i<alldata.length; i = i+2){
        let instance = {
            code: alldata[i].code,
            profile: alldata[i].profile,
            fitWin: alldata[i].fitWin,
            varWin: alldata[i].varWin,
            mean: alldata[i+1].mean - alldata[i].mean,
            median: alldata[i+1].median - alldata[i].median,
            std: alldata[i+1].std - alldata[i].std
        };
        data.push(instance)
    }
    
    let uFitWins = [...new Set(data.map(item => item.fitWin))];
    let uVarWins = [...new Set(data.map(item => item.varWin))];
    let metrics = ['Mean', 'Median', 'Std'];
    
    metricsSelect = document.getElementById("metric");
    populateSelect(metricsSelect, metrics);
    
    fitWinSelect = document.getElementById("fitWin");
    populateSelect(fitWinSelect, uFitWins);
    
    varWinSelect = document.getElementById("varWin");
    populateSelect(varWinSelect, uVarWins);
    
    chosenMetric = metricsSelect.options[metricsSelect.selectedIndex].value;
    chosenfitWin = fitWinSelect.options[fitWinSelect.selectedIndex].value;
    chosenvarWin = varWinSelect.options[varWinSelect.selectedIndex].value;

    datafilt = data.filter(d => d.varWin === chosenvarWin && d.fitWin === chosenfitWin);

    datafilt = datafilt.map(d => ({
        profile: d.profile,
        code: d.code,
        fitWin: d.fitWin,
        varWin: d.varWin,
        value: d[chosenMetric],
        profile: d.profile
    }));
    
    let w = d3.select("#allBars").attr("width")
    let h = d3.select("#allBars").attr("height")
    
    
    function updateBars(datafilt){

        let barbody = d3.select("#barbody");
        
        let maxval = d3.max(datafilt, function(d){return d.value});
        let minval = d3.min(datafilt, function(d){return d.value});
        
        let scaleposition = d3.scaleBand().range([0, w/1.2]).domain(datafilt.map(d => d.code)).padding(0.3);
        
        var yScale = d3.scaleLinear()
                     .domain([0, maxval])
                     .range([0, h]);

        var yAxisScale = d3.scaleLinear()
                         .domain([minval, maxval])
                         .range([h - yScale(minval), 0]);
        
        let xAxis = d3.axisBottom(scaleposition).tickFormat(d => "");
        
        let yAxis = d3.axisRight(yAxisScale);
        
        d3.select("#barXaxis")
        .attr("transform", "translate(0," + h/2 + ")")
        .attr("class", "codes")
        .call(xAxis);
        
        function showTooltip(text, coords){
        d3.select("#tooltip")
            .text(text)
            .style("top", coords[1]-45 + "px")
            .style("left", coords[0] + "px")
            .style("display", "block");
        }
        
        let joinBars = barbody.selectAll("rect").data(datafilt);

        joinBars.enter()
                .append("rect")
                .style("fill", "#2e4053")
                .style("stroke", function(d){
                    if(d.profile == "S"){
                        return "#16a085"
                    }else{
                        return "#2e4053"
                    }
                })
                .style("stroke-width", "3px")
                .attr("x", d => scaleposition(d.code))
                .attr("width", scaleposition.bandwidth())
                .attr("y", h)
                .attr("height", 0)
                .on("mouseenter", function(d){
                    this.style.fill = "#af7ac5";
                    let text = d.code + ": " + d.profile;
                    showTooltip(text, [d3.event.pageX, d3.event.pageY]);
                })
                .on("mouseout", function(){
                    this.style.fill = "#2e4053";
                    d3.select("#tooltip").style("display", "none");
                })
                .on("mousemove", function(d){
                    let text = d.code + ": " + d.profile;
                    showTooltip(text, [d3.event.pageX, d3.event.pageY]);
                  })
                .on("click", function(d){
                    d3.select(".theClickedOne").classed("theClickedOne", false);
                    d3.select(this).classed("theClickedOne", true);
                    selectedFile.code = d.code;
                    fitWinSelect = document.getElementById("fitWin");
                    varWinSelect = document.getElementById("varWin");
                    selectedFile.fitWin = fitWinSelect.options[fitWinSelect.selectedIndex].value;
                    selectedFile.varWin = varWinSelect.options[varWinSelect.selectedIndex].value;
                    filterFiles(selectedFile);
                })  
                    .merge(joinBars)
                    .transition().duration(500)
                    .attr("y", function(d, i) { return h - Math.max(0, yScale(d.value));})
                    .attr("height", function(d) { return Math.abs(yScale(d.value)); })

        joinBars.exit().remove();
     
    }
    updateBars(datafilt);
    
    function filterFiles(selectedFile){
        let singleData = filtdata.filter(d => d.code === selectedFile.code && d.varWin === selectedFile.varWin && d.fitWin === selectedFile.fitWin);   
        plotSingles(singleData);
    }
                        
    function selectionChange(){
        metricsSelect = document.getElementById("metric");
        fitWinSelect = document.getElementById("fitWin");
        varWinSelect = document.getElementById("varWin");

        chosenMetric = metricsSelect.options[metricsSelect.selectedIndex].value;
        chosenfitWin = fitWinSelect.options[fitWinSelect.selectedIndex].value;
        chosenvarWin = varWinSelect.options[varWinSelect.selectedIndex].value;

        datafilt = data.filter(d => d.varWin === chosenvarWin && d.fitWin === chosenfitWin);

        datafilt = datafilt.map(d => ({
            profile: d.profile,
            code: d.code,
            fitWin: d.fitWin,
            varWin: d.varWin,
            value: d[chosenMetric]                       
        }));
        selectedFile.fitWin = chosenfitWin;
        selectedFile.varWin = chosenvarWin;
        updateBars(datafilt);
    }
    d3.select("#metric").on("change", selectionChange)
    d3.select("#fitWin").on("change", selectionChange)
    d3.select("#varWin").on("change", selectionChange)
    
}

function plotSingles(singleData){
    
    showLines(singleData);
    showSlopes(singleData);
    showSlopes2(singleData);
    plotChunks(singleData);
    histPlot(singleData);
}

function populateSelect(sel, arr){
    sel.options.length = 0;
    for(i in arr){
       sel.options[sel.options.length] = new Option(arr[i], arr[i].toLowerCase());
    }
}

function range(start, end) {
    return (new Array(end - start)).fill(undefined).map((_, i) => i + start);
}

function showLines(data){
    data = data.map(d => ({
        profile: d.profile,
        code: d.code,
        fitWin: d.fitWin,
        varWin: d.varWin,
        value: d.variance                      
    }));
    
    let d3svg = d3.select("#linePlot");
    d3svg.selectAll("g").remove(); 

    data[0].time = range(0,data[0].value.length).map(d => d*(+data[0].varWin / 60));
    data[1].time = range(data[0].value.length, data[0].value.length + data[1].value.length).map(d => d*(+data[0].varWin / 60));
    
    let mediaData = []
    for (i=0; i<data[0].value.length; ++i){
	mediaData.push({
			value: data[0].value[i],
			time: data[0].time[i]			
            })}
    
    let drugData = []
    for (i=0; i<data[1].value.length; ++i){
	drugData.push({
			value: data[1].value[i],
			time: data[1].time[i]			
            })}
    
    
    let margin = {
      top: 20,
      right: 20,
      bottom: 50,
      left: 60
    };
    let width = +d3svg.attr('width') - margin.left - margin.right;
    let height = +d3svg.attr('height') - margin.top - margin.bottom;

    let xScale = d3.scaleLinear().range([0, width]);
    let yScale = d3.scaleLinear().range([height, 0]);

    let line = d3.line()
      .x(function(d) {
        return xScale(d.time)
      })
      .y(function(d) {
        return yScale(d.value)
      });

    let timeMax = d3.max(data[1].time);
    xScale.domain([0, timeMax]);
    
    let Mmax = d3.max(mediaData, function(d){return d.value});
    let Mmin = d3.min(mediaData, function(d){return d.value});
    let Dmax = d3.max(drugData, function(d){return d.value});
    let Dmin = d3.min(drugData, function(d){return d.value});
    
    yScale.domain([Math.min(Mmin, Dmin), Math.max(Mmax, Dmax)]);
    
    var frmt = d3.format(".0f")
    
    // This part is for the number and profile letter
    
    d3.select("#profTxt").style("display","inline");
    d3.select("#profTxt_sub").style("display","inline");
    
    d3.select("#profTxt")
        .transition()
        .duration(2500)
        .on("start", function repeat() {
          d3.active(this)
              .tween("text", function() {
                var that = d3.select(this),
                    i = d3.interpolateNumber(that.text().replace(/,/g, ""), timeMax);
                return function(t) { that.text(frmt(i(t))); };
              })
            .transition()
              .delay(1500)
              .on("start", repeat);
        });
    
    d3.select("#profTxt2").style("display","inline");
    d3.select("#profTxt_sub2").style("display","inline");
    
    d3.select("#profTxt2").text(data[0].profile)
    
    
    
    var g = d3svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var xAxis = d3.axisBottom(xScale)
      .ticks(5)

    g.append('g')
      .attr('class', 'axis axis-x')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis);

    var yAxis = d3.axisLeft(yScale)
      .tickFormat(d3.format('.4f'));

    g.append('g')
      .attr('class', 'axis axis-y')
      .call(yAxis);

    g.append('path')
      .datum(mediaData)
      .attr('fill', 'none')
      .attr('class', 'line line-media')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('stroke-width', 1.5)
      .attr("stroke", "#16a085")
        .attr('d', line)
        .call(transition);
    
    g.append('path')
      .datum(drugData)
      .attr('fill', 'none')
      .attr('class', 'line line-drug')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('stroke-width', 1.5)
      .attr("stroke", "#2e4053")
        .attr('d', line)
        .call(transition);
    
    let zoom = d3.zoom();
    zoom.on("zoom", function(){
      let newYScale = d3.event.transform.rescaleY(yScale)
      yAxis.scale(newYScale);
      d3.select(".axis-y").call(yAxis);
     
    line = d3.line()
      .x(function(d) {
        return xScale(d.time)
      })
      .y(function(d) {
        return newYScale(d.value)
      });
      g.selectAll(".metricirc").attr("cy", newYScale(0.0008))       
      g.selectAll("path.line").attr("d", line);
    })
    d3svg.call(zoom);
    

}

function transition(path) {
    path.transition()
    .duration(1000)
    .attrTween("stroke-dasharray", tweenDash)
    .on("end", function () { d3.select(this).attr("stroke-dasharray", null); });
}
function tweenDash() {
  var l = this.getTotalLength();
  return d3.interpolateString("0," + l, l + "," + l);
}

function showSlopes(singleData){
    
    let slopesvg = d3.select("#slopePlot1");
    slopesvg.selectAll("g").remove(); 
    
    let margin = {top: 20, right: 0, bottom: 20, left: 50}
    let width = +slopesvg.attr("width") - margin.left - margin.right
    let height = +slopesvg.attr("height") - margin.top - margin.bottom

    let x = d3.scalePoint().range([margin.left, width], 1)

    let line = d3.line(),
        axis = d3.axisLeft(),
        foreground;

    let data = [
        {"metric":"mean",
        "media": singleData[0].mean,
        "drug": singleData[1].mean},
        {"metric":"median",
        "media": singleData[0].median,
        "drug": singleData[1].median},
        {"metric":"std",
        "media": singleData[0].std,
        "drug": singleData[1].std}   
    ];
    
    dimensions = ["media", "drug"]
    x.domain(dimensions)

    dataVals = Object.keys(data).map(k => data[k].media).concat(Object.keys(data).map(k => data[k].drug))

    y = d3.scaleLinear()
        .domain(d3.extent(dataVals))
        .range([height*0.9, height*0.3]);

  foreground = slopesvg.append("g")
        .attr("class", "foreground")
        .selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("stroke", function(d){
            if(d.metric == "mean"){return "#af7ac5"}
            else if(d.metric == "median"){return "#48c9b0"}
            else if(d.metric == "std"){return "#c58a7a"}
        })
        .attr("stroke-width", "2px")
        .attr("d", path).call(transition);
    
    
     slopesvg.append("g")
        .attr("class", "legend")
        .selectAll("rect")
        .data(data)
        .enter().append("rect")
        .attr("fill", function(d){
            if(d.metric == "mean"){return "#af7ac5"}
            else if(d.metric == "median"){return "#48c9b0"}
            else if(d.metric == "std"){return "#c58a7a"}
        })
         .attr("y", (d,i) => i*15 + margin.top - 7)
         .attr("x", width/2 - 15)
         .attr("height", "10px").attr("width", "10px")
    
     slopesvg.append("g")
         .attr("class", "legend")
         .selectAll("text")
         .data(data)
         .enter().append("text")
         .attr("fill", function(d){
            if(d.metric == "mean"){return "#af7ac5"}
            else if(d.metric == "median"){return "#48c9b0"}
            else if(d.metric == "std"){return "#c58a7a"}
        })
         .attr("y", (d,i) => i*15 + margin.top)
         .attr("x", width/2)
         .text(d => d.metric).style("font-size", "14px");
    
    
    

  var g = slopesvg.selectAll(".dimension")
      .data(dimensions)
    .enter().append("g")
      .attr("class", "dimension")
      .attr("transform", function(d) { return "translate(" + x(d) + ")"; });

  g.append("g")
      .attr("class", "slopeaxis")
      .each(function(d) { d3.select(this).call(axis.scale(y).ticks(2)); })
    .append("text")
      .style("text-anchor", "middle")
      .attr("y", margin.top)
      .text(function(d) { return d; }).attr("fill", "#2e4053").style("font-size", "14px");

    function path(d) {
      return line(dimensions.map(function(p) { return [x(p), y(d[p])]; }));
    }
    
}
function showSlopes2(singleData){
    
    let slopesvg = d3.select("#slopePlot2");
    slopesvg.selectAll("g").remove(); 
    
    let margin = {top: 20, right: 20, bottom: 20, left: 50},
    width = +slopesvg.attr("width") - margin.left - margin.right,
    height = +slopesvg.attr("height") - margin.top - margin.bottom;

    let x = d3.scalePoint().range([margin.left, width], 1)

    let line = d3.line(),
        axis = d3.axisLeft(),
        foreground;

    function checkNum(d){
        if(!isNaN(d) && isFinite(d)){
            return d;} else {
                return 0;
            }    
    }
    let data = [
        {"metric":"kurtosis",
        "media": checkNum(singleData[0].kurtosis/singleData[0].kurtosis),
        "drug": checkNum(singleData[1].kurtosis/singleData[0].kurtosis)},
        {"metric":"slope",
        "media": checkNum(singleData[0].slope/singleData[0].slope),
        "drug": checkNum(singleData[1].slope/singleData[0].slope)},
        {"metric":"intercept",
        "media": checkNum(singleData[0].intercept/singleData[0].intercept),
        "drug": checkNum(singleData[1].intercept/singleData[0].intercept)},
        {"metric":"skew",
        "media": checkNum(singleData[0].skew/singleData[0].skew),
        "drug": checkNum(singleData[1].skew/singleData[0].skew)}
    ];
    
    dimensions = ["media", "drug"]
    x.domain(dimensions)

    dataVals = Object.keys(data).map(k => data[k].media).concat(Object.keys(data).map(k => data[k].drug))

    y = d3.scaleLinear()
        .domain(d3.extent(dataVals))
        .range([height*0.9, height*0.3]);

    foreground = slopesvg.append("g")
                .attr("class", "foreground")
                .selectAll("path")
                .data(data)
                .enter().append("path")
                .attr("stroke", function(d){
                    if(d.metric == "kurtosis"){return "#af7ac5"}
                    else if(d.metric == "slope"){return "#48c9b0"}
                    else if(d.metric == "intercept"){return "#c58a7a"}
                    else if(d.metric == "skew"){return "#7ab6c5"}
                    })
                .attr("stroke-width", "2px")
                .attr("d", path).call(transition);
    
    slopesvg.append("g")
        .attr("class", "legend")
        .selectAll("rect")
        .data(data)
        .enter().append("rect")
        .attr("fill", function(d){
                    if(d.metric == "kurtosis"){return "#af7ac5"}
                    else if(d.metric == "slope"){return "#48c9b0"}
                    else if(d.metric == "intercept"){return "#c58a7a"}
                    else if(d.metric == "skew"){return "#7ab6c5"}
        })
        .attr("y", (d,i) => i*15 + margin.top - 7)
        .attr("x", width/2 - 15)
        .attr("height", "10px").attr("width", "10px")
    
     slopesvg.append("g")
         .attr("class", "legend")
         .selectAll("text")
         .data(data)
         .enter().append("text")
         .attr("fill", function(d){
                if(d.metric == "kurtosis"){return "#af7ac5"}
                else if(d.metric == "slope"){return "#48c9b0"}
                else if(d.metric == "intercept"){return "#c58a7a"}
                else if(d.metric == "skew"){return "#7ab6c5"}
        })
        .attr("y", (d,i) => i*15 + margin.top)
        .attr("x", width/2)
        .text(d => d.metric).style("font-size", "14px");
    

  var g = slopesvg.selectAll(".dimension")
        .data(dimensions)
        .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; });

  g.append("g")
      .attr("class", "slopeaxis")
      .each(function(d) { d3.select(this).call(axis.scale(y).ticks(2)); })
      .append("text")
      .style("text-anchor", "middle")
      .attr("y", margin.top)
      .text(function(d) { return d; }).attr("fill", "#2e4053").style("font-size", "14px");

    function path(d) {
      return line(dimensions.map(function(p) { return [x(p), y(d[p])]; }));
    } 
}

function plotChunks(singleData){

    let mediaData = []
    for (i=0; i<singleData[0].varChunks.length; ++i){
	mediaData.push({
			value: singleData[0].varChunks[i],
			media: singleData[0].media			
            })}
    
    let drugData = []
    for (i=0; i<singleData[1].varChunks.length; ++i){
	drugData.push({
			value: singleData[1].varChunks[i],
			time: singleData[1].media			
            })}
    
    let data = mediaData.concat(drugData);
    
    let barbody = d3.select("#barPlotChunks")
    let h = barbody.attr("height")
    let w = barbody.attr("width")
    let margin = ({top: 20, right: 0, bottom: 30, left: 40})
    let maxval = d3.max(data, function(d){return d.value});
    let scale = d3.scaleLinear().range([h - margin.bottom, margin.top])
                                .domain([0, maxval]);
    let scaleposition = d3.scaleBand().range([margin.left, w - margin.right])
                        .domain(data.map(function(d, i) { return i; }))
                        .padding(0.3);

    let joinBars = barbody.selectAll("rect").data(data);
    
    joinBars.enter()
            .append("rect")
            .attr("fill", function(d){
                    if(d.media == "media"){
                        return "#16a085"
                    }else{
                        return "#2e4053"
                    }
                })
            .attr("stroke", "none")
            .attr("height", 0)
            .attr("width", scaleposition.bandwidth())
            .attr("x", (d,i) => scaleposition(i))
            .attr("y", h) 
            .on("mouseover", function(d){
            this.style.opacity = 0.5;
            })
            .on("mouseout", function(){
            this.style.opacity = 1
            })
            .merge(joinBars)
            .transition().duration(500)
            .attr("y", d => scale(d.value))
            .attr("height", d => scale(0) - scale(d.value))

    joinBars.exit().remove();
    
    
}

function histPlot(singleData){
  
    let mediaData = singleData[0].variance;
    let drugData = singleData[1].variance;

    let maxval = d3.max(mediaData.concat(drugData));

    let histsvg = d3.select("#histPlot");
    histsvg.selectAll("g").remove(); 
    
    let margin = {top: 20, right: 20, bottom: 20, left: 50}
    let width = +histsvg.attr("width") - margin.left - margin.right
    let height = +histsvg.attr("height") - margin.top - margin.bottom
    
    let x = d3.scaleLinear().domain([0, maxval]).range([margin.left, width]);

    let binsM = d3.histogram().domain(x.domain()).thresholds(x.ticks(30))(mediaData);
    let binsD = d3.histogram().domain(x.domain()).thresholds(x.ticks(30))(drugData);

    let y = d3.scaleLinear().domain([0, .1]).range([0, height]);

    let maxyM = d3.max(binsM, function(d) {
        return d.length;
      })
    let maxyD = d3.max(binsD, function(d) {
        return d.length;
      })
    let maxy = Math.max(maxyM, maxyD)
    
    let yForHistogram = d3.scaleLinear()
      .domain([0, maxy])
      .range([height, 0]);

    let bars = histsvg.selectAll("g.barM")
      .data(binsM)
      .enter().append("g")
      .attr("class", "barM")
      .attr("transform", function(d) {
        return "translate(" + x(d.x0) + "," + yForHistogram(d.length) + ")";
      })
        .attr("height", 0);;

    bars.append("rect")
      .attr("fill", "#16a085")
      .attr("width", x(binsM[0].x1) - x(binsM[0].x0) - 1).transition()
      .attr("height", function(d) {
        return height - yForHistogram(d.length);
      });
    
    let barsD = histsvg.selectAll("g.barD")
      .data(binsD)
      .enter().append("g")
      .attr("class", "barD")
      .attr("transform", function(d) {
        return "translate(" + x(d.x0) + "," + yForHistogram(d.length) + ")";
      })
        .attr("height", 0);
    
     barsD.append("rect")
      .attr("fill", "#2e4053")
    .attr("opacity", 0.7)
      .attr("width", x(binsD[0].x1) - x(binsD[0].x0) - 1).transition()
      .attr("height", function(d) {
        return height - yForHistogram(d.length);
      });
    
    let legend = histsvg.append("g")
      .attr("class", "legend")
    
    let histsM = {};
    let histsD = {};
    legend.append("rect")
        .attr("fill", "#16a085")
        .attr("y", margin.top - 17)
        .attr("x", width - width/4)
        .attr("height", "15px").attr("width", "15px")
        .on("mouseenter", function(){
            d3.select(this).attr("stroke", "#16a085").attr("stroke-width", "5px")
        })
        .on("mouseleave", function(){
            d3.select(this).attr("stroke", "none")
        })
        .on("click", function(){
            var active   = histsM.active ? false : true,
              newOpacity = active ? 0 : 1;
            d3.selectAll(".barM").style("opacity", newOpacity);
            histsM.active = active;
        })
    
    legend.append("rect")
        .attr("fill", "#2e4053")
        .attr("y", 18 + margin.top - 17)
        .attr("x", width - width/4)
        .attr("height", "15px").attr("width", "15px")
        .on("mouseenter", function(){
            d3.select(this).attr("stroke", "#2e4053").attr("stroke-width", "5px")
        })
        .on("mouseleave", function(){
            d3.select(this).attr("stroke", "none")
        })
        .on("click", function(){
            var active   = histsD.active ? false : true,
              newOpacity = active ? 0 : 1;
            d3.selectAll(".barD").style("opacity", newOpacity);
            histsD.active = active;
        })
    
     histsvg.append("g")
        .attr("class", "legend")
        .selectAll("text")
        .data(singleData)
        .enter().append("text")
        .attr("fill", function(d){
                    if(d.media == "media"){return "#16a085"}
                    else if(d.media == "drug"){return "#2e4053"}
        })
        .attr("y", (d,i) => i*15 + margin.top -5)
        .attr("x", width - width/4 + 20)
        .text(d => d.media).style("font-size", "15px");
    
     
    let xAxis = d3.axisBottom(x).ticks(6).tickFormat(d => d);
    
    histsvg.append("g").attr("class", "histos")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);   
}

d3.select("#hlpicn")
    .on("mouseover", function(){
        d3.selectAll(".cls-1").style("fill", "#16a085")
    })
    .on("mouseleave", function(){
        d3.selectAll(".cls-1").style("fill", "#999")
    })
    .on("click", function(){
        d3.select("#overlay").style("display", "block");
    })

function HlpOff(){
    d3.select("#overlay").style("display", "none");
}