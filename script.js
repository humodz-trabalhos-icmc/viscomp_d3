// jshint esversion: 6

var canvas = {
    width: 800,
    height: 600
};


var margin = {
    top: 15,
    bottom: 15,
    left: 80,
    right: 20,
};

margin.topBottom = margin.top + margin.bottom;
margin.leftRight = margin.left + margin.right;

svg = d3.select('#d3-container').append('svg').attr({
    width: canvas.width,
    height: canvas.height
});


var g = {};

g.text_columns = ['Country', 'University_Name'];

g.circlesGroup = svg.append('g');

g.xAxis = d3.svg.axis()
    .orient('bottom')
    .outerTickSize(0);

g.yAxis = d3.svg.axis()
    .orient('left')
    .outerTickSize(0);

g.xAxisSvg = svg
    .append('g')
    .attr('class', 'axis')
    .attr('transform', translate(0, canvas.height - margin.topBottom));

g.yAxisSvg = svg
    .append('g')
    .attr('class', 'axis')
    .attr('transform', translate(margin.left, 0));





d3.csv('TWUR 2016.csv', function(data) {
    g.data = preprocess(data);
    g.cols = Object.keys(g.data[0]);


    // Add column names as options to <select> menus
    $.each(g.cols, function(i, col) {
        if(g.text_columns.indexOf(col) === -1) {
            $('select').append($('<option>', {
                value: col,
                text: col
            }));
        }
    });

    $('input#ok').click(function() {
        var xcol = $('select[name="x-axis"]').val();
        var ycol = $('select[name="y-axis"]').val();

        if(!xcol || !ycol) {
            alert('Please choose both axes.');
        } else {
            doStuff(g.data, xcol, ycol);
        }
    });
});


function preprocess(data) {
    $.each(data, function(index, row) {
        row.id = index;
        for(var key in row) {
            var value = row[key];

            if(key === 'World_Rank') {
                var i = value.indexOf('-');

                if(i === -1) {
                    // Just a number
                    row[key] = +value;
                } else {
                    // X-Y range -> take mean
                    var low = +value.slice(0, i);
                    var hight = +value.slice(i + 1);

                    row[key] = (low + high) / 2;
                }
            } else if(g.text_columns.indexOf(key) === -1) {
                // Convert only numeric columns
                if(value !== '') {
                    row[key] = +value;
                } else {
                    row[key] = NaN;
                }
            }
        }
    });

    return data;
}



function doStuff(data, xcol, ycol) {
    var xIsNumber = typeof data[0][xcol] === 'number';
    var yIsNumber = typeof data[0][ycol] === 'number';

    // Filter NaNs
    filtered_data = data.filter((row) => {
        var xnan = isNaN(row[xcol]) && xIsNumber;
        var ynan = isNaN(row[ycol]) && yIsNumber;

        return !xnan && !ynan;
    });

    var dropped = data.length - filtered_data.length;
    $('#message').html('Dropped ' + dropped + ' missing values.');

    // TODO ordinal

    var xDomain = getLinearDomain(filtered_data, xcol);

    var xScale = d3.scale.linear()
        .range([margin.left, canvas.width - margin.leftRight])
        .domain(xDomain);

    // xScale = d3.scale.ordinal()


    var yDomain = getLinearDomain(filtered_data, ycol);

    var yScale = d3.scale.linear()
        .range([canvas.height - margin.topBottom, margin.top])
        .domain(yDomain);


    g.xAxis.scale(xScale);
    g.yAxis.scale(yScale);

    var circles = g.circlesGroup
        .selectAll('circle')
        .data(filtered_data, (row) => row.id);

    circles.exit().remove();

    function updateAttr(selection) {
        selection
            .attr('cx', (row, index) => xScale(row[xcol]))
            .attr('cy', (row, index) => yScale(row[ycol]));
    }

    updateAttr(circles.enter().append('circle'));
    updateAttr(circles.transition());

    g.xAxisSvg.transition().call(g.xAxis);
    g.yAxisSvg.transition().call(g.yAxis);
}


function getLinearDomain(data, col) {
    var min = data.reduce(function(answer, row) {
        if(row[col] < answer[col]) {
            return row;
        } else {
            return answer;
        }
    });

    var max = data.reduce(function(answer, row) {
        if(row[col] > answer[col]) {
            return row;
        } else {
            return answer;
        }
    });

    min = min[col];
    max = max[col];

    var interval = max - min;
    var padding = interval / 20;
    return [min - padding, max + padding];
}


function uniqueValuesByFrequency(data, col) {
    var frequency = {};
    var selection = data.map((row) => row[col]);

    selection.forEach(function(elem) {
        frequency[elem] = 0;
    });

    var uniques = selection.filter(function(elem) {
        return ++frequency[elem] == 1;
    });

    var sorted = uniques.sort(function(a, b) {
        return frequency[b] - frequency[a];
    });

    return sorted;
}



function translate(w, h) {
    return 'translate(' + [w, h] + ')';
}

