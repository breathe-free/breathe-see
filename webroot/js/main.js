// Set up Faye client and listen for data from the server
var client = new Faye.Client('/faye');


function handleData(incoming) {
    // incoming.data is a comma-separated list of numbers to plot
    yValues = incoming.data.split(",");
    var mydata = [];
    for (i=0; i<yValues.length; i++) {
        mydata.push({x: i, y:yValues[i]})
    }
    plotData(mydata);
}

// call the plot function when new data arrives
client.subscribe('/data', handleData);

// Set the dimensions of the canvas / graph
var margin = {top: 30, right: 20, bottom: 30, left: 50},
width = 600 - margin.left - margin.right,
height = 270 - margin.top - margin.bottom;

// Set the ranges
var x = d3.scale.linear().range([0, width]);
var y = d3.scale.linear().range([height, 0]);

// Define the axes
var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(5);

var yAxis = d3.svg.axis().scale(y).orient("left").ticks(5);

// Define the line
var valueline = d3.svg.line()
.x(function(d) { return x(d.x); })
.y(function(d) { return y(d.y); });

// Adds the svg canvas
var svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", 
    "translate(" + margin.left + "," + margin.top + ")");

// Scale the range of the data
x.domain([0, 1000]);
y.domain([0, 1000]);

// Add the X Axis
svg.append("g")
.attr("class", "x axis")
.attr("transform", "translate(0," + height + ")")
.call(xAxis);

// Add the Y Axis
svg.append("g")
.attr("class", "y axis")
.call(yAxis);

var myline = false;  // global variable for holding a reference to the plotted line

function plotData(mydata) {
    // clear any existing line
    if (myline) {
        myline.remove();
    }

    myline = svg.append("path").attr("class", "line").attr("d", valueline(mydata));

}