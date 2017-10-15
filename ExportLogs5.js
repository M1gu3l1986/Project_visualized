"use strict"
// Batch export files from Norway where they have followed up on the export time for different projects
//loads in the data

function loadTXT1() {
	jQuery.get('ExportLogs.txt', function(data) {
		var a = data;

		var newData = d3.tsvParse(a) //using d3's tsvParse-function to get the data better organized and readable
		
		var i = 0;
		newData.map(function (dataIn) {
			newData[i].startedtimes = newData[i].started.split(" ");
			i = i + 1;
			return dataIn["Duration (min)"] = +dataIn["Duration (min)"]; //turns the time from string-value to number-value
		});
		
		
		//var C = d3.timeFormat("%H:%M %p")
		var C = d3.timeFormat("%H:%M");  //I want the hours and the minutes
		
		newData.forEach(function(d) {
			//ended
			var a = d.ended.split(/[ .:]+/); //split and using a regex to split by space and dot and colon
			d.endedA = new Date(a[2], a[1]-1, a[0], a[3], a[4]); //for some reason the month is off by 1 in javascript date object
		});
		
		
		//Makes the data usable for multiple lines
		var projectExports = d3.nest()
							.key(function (d) { return d['Export'];})
							//.rollup(function(a) {return a.length;})
							.entries(newData);
							
		
		projectExports.forEach(function(dataExports) {
						
				
		
		
		var oneExport = dataExports;
				
			// variables
			var margin = {top: 20, right: 20, bottom: 200, left: 60},
				width = 1500 - margin.left - margin.right,
				height = 700 - margin.top - margin.bottom,
				//xScale = d3.scaleBand().rangeRound([0, width], 0.5),
				xScale = d3.scaleBand().range([0, width]),
				yScale = d3.scaleLinear().range([height, 0]);
				
			
			
			
				
				//the domain
				xScale.domain(oneExport.values.reverse().map(function(d) {return d["started"]; })); //console.log(d["started"]); 
				//yScale.domain([0, d3.max(oneExport.values.reverse(), function(d) {var a = d["Duration (min)"].toString().length; return Math.ceil(d["Duration (min)"]/(Math.pow(10,a)))*(Math.pow(10,a)); })]);
				//yScale.domain([0, d3.max(oneExport.values.reverse(), function(d) {var a = d["Duration (min)"].toString().length; return Math.ceil(d["Duration (min)"]); })]);
			    yScale.domain([0, d3.max(oneExport.values.reverse(), function(d) {var a = d["Duration (min)"].toString().length; return Math.ceil(d["Duration (min)"]/(Math.pow(10,a-1)))*(Math.pow(10,a-1)); })]);
			
			var xAxis = d3.axisBottom(xScale).tickValues(xScale.domain().filter(function(d,i){return !(i%5)}));

			var yAxis = d3.axisLeft(yScale);


	
				
			//append the svg
			var myChart = d3.select("#d3_canvas")
				.append("svg")
				.attr("class", "svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
				
				
				
			
			// add the Y gridlines
			// gridlines in y axis function
			function make_y_gridlines() {		
				return d3.axisLeft(yScale)
			}
			
			
			  myChart.append("g")			
				  .attr("class", "grid")
				  .call(make_y_gridlines()
					  .tickSize(-width)
					  .tickFormat(""));

			
			var color = d3.scaleOrdinal()
			.domain(["PC37156", "PC36132", "PC81714"])
			.range(["red", "orange", "green"]);

			
			
			// the bar chart
			myChart.selectAll(".bar")
			.data(oneExport.values)
			.enter().append("rect")
			  .attr("class", "bar")
			  .attr("x", function(d) { return xScale(d["started"]); })
			  .attr("y", function(d) { return yScale(d["Duration (min)"]); })
			  .attr("width", xScale.bandwidth())
			  .attr("height", function(d) { return height - yScale(d["Duration (min)"]); })
			  .attr("fill", function (d)
			{
				//console.log(d.machine);
				return color(d.machine);
			})
			.append("svg:title")
	    	.text(function(d) {return d["Duration (min)"] + " min - started: " + d["started"]});

 
		
			// x-axis	
			myChart.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0, " + height + ")")
				.call(xAxis)
				.selectAll("text")
				.style("text-anchor", "end")
				.attr("dx", "-0.5em")
				.attr("dy", "-0.55em")
				.attr("y", 30)
				.attr("transform", "rotate(-45)");
			
			// y-axis
			myChart.append("g")
				.attr("class", "y axis")
				.call(yAxis)
				.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", 5)
				.attr("x", -5)
				.attr("dy", "0.8em")
				.attr("text-anchor", "end");
				
				
			//axis texts
			myChart
			.append("text")
				.attr("class", "x label")
				.attr("text-anchor", "start")
				.attr("x", width/2 - 20)
				.attr("y", height*1.2)
				.text("Date");

					
			myChart
			.append("text")
				.attr("class", "y label")
				.attr("text-anchor", "end")
				.attr("y", 6)
				.attr("dy", ".75em")
				.attr("transform", "rotate(-90)")
				.text("Export time (min)");
				
				
			//legends
			var legendRectSize = 18;
			var legendSpacing = 4;
			
			
			var theseValues = d3.nest()
							.key(function (d) { return d["machine"];})
							//.rollup(function(a) {return a.length;})
							.entries(oneExport.values);
			
			var allKeys = Object.keys(theseValues);
			
			var keytest = theseValues.map(function(nowIn){ //forEach doesn't return anything, must use map
				return nowIn.key;
			});
						
			var legend = myChart.selectAll('.legend')
				  .data(keytest)
				  .enter()
				  .append('g')
				  .attr('class', 'legend')
				  .attr('transform', function(d, i) {
					var height = legendRectSize + legendSpacing;
					var offset =  height * color.domain().length;
					var horz = legendRectSize + 15;
					var vert = i * height + 5;
					return 'translate(' + horz + ',' + vert + ')';
				  });
				  
			legend.append('rect')
			  .attr('width', legendRectSize)
			  .attr('height', legendRectSize)
			  .style('fill', color)
			  .style('stroke', color);

			legend.append('text')
			  .attr('x', legendRectSize + legendSpacing)
			  .attr('y', legendRectSize - legendSpacing)
			  .text(function(d,i) {return d});
				
			
			//console.log(oneExport);
			//var projectNameKey = Object.keys(oneExport.key);
			
			//Title
			myChart.selectAll('.title')
				  .data([oneExport.key])
				  .enter()
				  .append('g')
				  .attr('class', 'title')
			.append("text")
				.attr("x", (width / 2))             
				.attr("y", margin.top)
				.attr("text-anchor", "middle")  
				.style("font-size", "20px") 
				.text(function(d) {return "Export: " + d});

	
				});
		
	});	
}


