"use strict"
// Batch export files from Norway where they have followed up on the export time for different projects
//loads in the data

function loadTXT1() {
	jQuery.get('ExportLogs.txt', function(data) {
		var a = data;

		var newData = d3.tsvParse(a) //using d3's tsvParse-function to get the data better organized and readable
		
		var i = 0;
		newData.map(function (dataIn) {
			return dataIn["Duration (min)"] = +dataIn["Duration (min)"]; //turns the time from string-value to number-value
		});
		
		
		//var C = d3.timeFormat("%H:%M %p")
		var C = d3.timeFormat("%H:%M");  //I want the hours and the minutes
		
		newData.forEach(function(d) {
			//ended
			var a = d.ended.split(/[ .:]+/); //split and using a regex to split by space and dot and colon
			var b = d.started.split(/[ .:]+/); //split and using a regex to split by space and dot and colon
			d.endedA = new Date(a[2], a[1]-1, a[0], a[3], a[4]); //for some reason the month is off by 1 in javascript date object
			d.endedDay = new Date(a[2], a[1]-1, a[0], 0, 0);
			d.endedHours = new Date(0,0,0, a[3], a[4]);
			
			d.startedB = new Date(b[2], b[1]-1, b[0], b[3], b[4]);
			d.startedDay = new Date(b[2], b[1]-1, b[0],0,0);
			d.startedHours = new Date(0,0,0, b[3], b[4]);
			
		});
		
		//console.log(newData);
		
		var layerColumn = "machine";
		
		//Makes the data usable for multiple lines
		var projectExports = d3.nest()
							.key(function (d) { return d[layerColumn];})
							//.key(function (d) { return d[xColumn];})
							//.rollup(function(a) {return a.length;})
							.entries(newData.reverse());
		
		
		var theArray = newData.map(function(valueIn) {
			return valueIn.Export;
			});

		var theExports = theArray.filter(onlyUnique);
		
		function onlyUnique(value, index, self) { 
			return self.indexOf(value) === index;
			}
		
		//setting the color scale
		var color = d3.scaleLinear()
			.domain([0,(theExports.length-1)/2,theExports.length-1])
			.range(["red", "yellow", "green"]);		

		
		//Appending divs using Jquery
		for(i = 0; i <= projectExports.length-1; i++) {
			$('body').append('<div class="chart_canvas" id="div'+ i +'" />');
			$('#div'+i).append('<div id="headline'+ i +'" />');
			$('#div'+i).append('<div id="d3_canvas'+ i +'" />');
			$('#div'+i).append('<div id="legend'+ i +'" />');
		  }		
		
	
		// variables
			var margin = {top: 30, right: 20, bottom: 100, left: 60},
				width = 1400 - margin.left - margin.right,
				height = 600 - margin.top - margin.bottom,
				yScale = d3.scaleTime().range([height, 0]),
				xScale = d3.scaleTime().range([0, width]);
				
			var heightLegend = 80;
				
		//draw axis
			var xAxis = d3.axisBottom()
				.scale(xScale);

			var yAxis = d3.axisLeft()
				.scale(yScale);
		
		//Loops over the machines
		projectExports.map(function(computer,machineIndex) {	
	
		//console.log(computer);
		var test = computer;
		
			var myChart = d3.select("#d3_canvas" + machineIndex)
				.append("svg")
				.attr("id", "svg2")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
				
				
			//The domain
			yScale.domain([new Date(0,0,0,0,0), new Date(0,0,0,24,0)]); // input is an ARRAY!!! //make sure hat it is the hours and minutes of the date that you pass into this object from the date
			
						
			xScale.domain([d3.min(newData, function (d) {
				return d.startedDay;
				}),
				d3.max(newData, function (d) {
				return d.startedDay;
				})	
			]); 
			
			//calculating the difference between two dates at the same time:
			var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
			var firstDate = xScale.domain()[0];
			var secondDate = xScale.domain()[1];
			
			var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay)));
			//console.log(diffDays);
					
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
			
			
			var computerValues = test.values;
			
			
			computerValues.forEach(function(d) {
				d.colorIndex = theExports.indexOf(d.Export);
				});
		
						
			// the gantt-schema
			myChart.selectAll("rect")
				.data(computerValues)
				.enter()
				.append("rect")
				.attr("x", function (d)
				{
					//console.log(xScale(d.startedDay));
					return xScale(d.endedDay);
				})
				.attr("y", function (d) {
					return yScale(d.endedHours);  //Quite opposite to what intuition says: You start at the end and then the bar grows downwards! =D
				})
				
				.attr("height", function (d,i) {
					if(d.endedHours < d.startedHours) {
						return -yScale(d.endedHours) + height + yScale(d.startedHours);
					} else {
						return   yScale(d.startedHours) - yScale(d.endedHours);
					}
				})
				.attr("width", function (d)
				{
					return width/diffDays; //set to the width of the days
				})
				.attr("fill", function (d)
				{
					return color(d.colorIndex);
				})
				.append("svg:title")
				.text(function(d,i) {return i + " " + d.startedB + " " + d.Export + " " + d["Duration (min)"] + " min"});
			
			
				// x-axis	
				myChart.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(" + 0 + ", " + height + ")")
					.call(xAxis) 
					.call(d3.axisBottom(xScale)
					  .tickFormat(d3.timeFormat("%Y-%m-%d")) //just svaed the whole: d3.timeFormat("%Y-%m-%d %H:%M")
					  .ticks(70)
					  .tickSize(8))
					.selectAll("text")
					.style("text-anchor", "end")
					.attr("y", 0)
					.attr("x", -20)
					.attr("transform", "rotate(-90)");
					
					
				// y-axis	
				myChart.append("g")
					.attr("class", "x axis")
					.call(yAxis) 
					.call(d3.axisLeft(yScale)
					  .tickFormat(d3.timeFormat("%H:%M")));
					  
					  
				// the legend and it is appended to a new div
				var legendRectSize = 18;
				var legendSpacing = 4;

				
				var legend = d3.select("#legend"+ machineIndex)
				.append("svg")
				.attr("id", "legend_svg")
				.attr("width", width)
				.attr("height", heightLegend)
				.selectAll('.legend')
				  .data(theExports)
				  .enter()
				  .append('g')
				  .attr('class', 'legend')
				  .attr('transform', function(d, i) {
					var height = legendRectSize + legendSpacing;
					var offset =  height * color.domain().length;
					var horz = 5 * i * legendRectSize + width/6;
					var vert = heightLegend/2;
					return 'translate(' + horz + ',' + vert + ')';
				  });
					  
				legend.append('rect')
				  .attr('width', legendRectSize)
				  .attr('height', legendRectSize)
				  .attr('fill', function(d){
					return color(theExports.indexOf(d))

				  });
				  

				legend.append('text')
				  .attr('x', legendRectSize + legendSpacing)
				  .attr('y', legendRectSize - legendSpacing)
				  .text(function(d,i) {return d});
			
			//the headline and it is also appended to a new div
			var chartHeadline = d3.select("#headline"+ machineIndex)
				.append("text")
				.text("Computer: "+ computer.key);
				  
 			});
				
	});}