var ctx = {
  dataFile: "exoplanet.eu_catalog.20210927.csv",
  sampleSize : '*',
  scaleTypeSP : 'linear',
  MIN_YEAR: 1987,
  DETECTION_METHODS_RVPT: ["Radial Velocity", "Primary Transit"],
  DETECTION_METHODS_ALL4: ["Radial Velocity", "Primary Transit",
                           "Microlensing", "Imaging"],
  DM_COLORS: ['#cab2d6', '#fdbf6f', '#b2df8a', '#fb9a99']
}

var createMassScatterPlot = function(scaleType, sampleSize){
    /* scatterplot: planet mass vs. star mass
       showing year of discovery using color,
       and detection method using shape,
       to be sync'ed with line bar chart below (brushing and linking) */    
    var vlSpec = {
        "data":{"url": ctx.dataFile},
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "transform":[
            {"filter": {"field": "mass", "gt":0}},
            {"filter": {"field": "star_mass", "gt":0}},
            {"filter": {"field": "discovered", "type": "temporal","timeUnit": "year", "gte": ctx.MIN_YEAR}},
            {"filter": {"field": "detection_type", "oneOf" : ctx.DETECTION_METHODS_RVPT}}
        ],
        "selection":{"exoplanet":{"type": "interval"}},
        "mark": "point",
        "encoding":{
            "x": {
                "field":"star_mass", 
                "axis":{"title":"Star Mass (M¤)"}, 
                "type":"quantitative",
                "scale": {"type": scaleType}
            },
            "y": {
                "field":"mass",
                 "axis":{"title":"Mass (MJup)"},
                  "type":"quantitative",
                  "scale": {"type": scaleType}
            },
            "tooltip":[
                {"field": "name", "type": "nominal"},
                {"field": "discovered", "type":"temporal", "timeUnit": "year"}
            ],
            "stroke": {"value":null},
            "size": {"value": 30},
            "shape":{"type": "nominal", "field": "detection_type","legend":{"title": "Detection Type"}},
            "fill": {
                "condition":{
                    "selection":"exoplanet",
                    "field":"discovered",
                    "type":"temporal",
                    "timeUnit":"year",
                    "scale":{
                        "scheme": {"name": "blues", "extent": [-1.5,2.5]}
                    },
                    "legend":{"title": "Year Discovered"}
                },
                "value":"blue"

            }
        },
    };
    if (sampleSize != "*"){
        vlSpec["transform"].push({"sample": parseInt(sampleSize)});
    }
    // see options at https://github.com/vega/vega-embed/blob/master/README.md
    var vlOpts = {width:700, height:700, actions:false};
    vegaEmbed("#massScat", vlSpec, vlOpts);
};

var createMagV2DHisto = function(){
    /* 2D histogram in the bottom-right cell,
       showing V-magnitude distribution (binned)
       for each detection_method */
    vlSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "data": {
            "url": ctx.dataFile
        },
        "transform":[
            {"filter": {"field":"detection_type", "oneOf": ctx.DETECTION_METHODS_ALL4}}
        ],
        "mark": "rect",
        "encoding":{
            "x":{
                "field": "detection_type",
                "axis": {"title": "Detection Method"},
                "type": "nominal"
            },
            "y":{
                "field":"mag_v",
                "axis":{"title": "Magnitude (V band)"},
                "type": "quantitative",
                "bin": {"maxbins":45}
            },
            "color":{
                "scale":{"scheme":{"name":"reds"}},
                "aggregate": "count",
                "type": "quantitative",
                "legend": {"title": "Count"}
            }
        }
    };
    vlOpts = {width:300, height:300, actions:false};
    vegaEmbed("#vmagHist", vlSpec, vlOpts);
};

var createDetectionMethodLinePlot = function(){
    // line plot: planet discovery count vs. year
    vlSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "data": {
            "url": ctx.dataFile
        },
        "transform": [
            {"filter": {"field": "detection_type", "oneOf": ctx.DETECTION_METHODS_ALL4}},
            {"filter": {"field": "discovered", "timeUnit": "year", "gte": ctx.MIN_YEAR}},
            {"sort": [{"field": "discovered"}],
             "window": [{"op": "count", "as": "cumulative_count"}],
             "frame": [null, 0]}
        ],
        "layer":[
        {
            "mark": "line",
            "encoding": {
                "x": {
                    "field": "discovered",
                    "type": "temporal",
                    "timeUnit": "year",
                    "axis":{"title": "Year"}
                },
                "y": {
                    "aggregate": "count",
                    "field": "*",
                    "type": "quantitative",
                    "axis":{"title": "Count"}
                },
                "color": {
                    "field": "detection_type",
                    "type": "nominal",
                    "legend": {"title": "Detection Method"},
                    "scale": {
                        "scheme": ctx.DM_COLORS,
                    },
                },
            },
        }]
    };
    vlOpts = {width:300, height:300, actions:false};
    vegaEmbed("#discPlot", vlSpec, vlOpts);
};

var createViz = function(){
    vega.scheme("dmcolors", ctx.DM_COLORS);
    createMassScatterPlot(ctx.scaleTypeSP, '*');
    createMagV2DHisto();
    createDetectionMethodLinePlot();
};

var handleKeyEvent = function(e){
    if (e.keyCode === 13){
        // enter
        e.preventDefault();
        setSample();
    }
};

var updateScatterPlot = function(){
    createMassScatterPlot(ctx.scaleTypeSP, ctx.sampleSize);
};

var setScaleSP = function(){
    ctx.scaleTypeSP = document.querySelector('#scaleSelSP').value;
    updateScatterPlot();
};

var setSample = function(){
    var sampleVal = document.querySelector('#sampleTf').value;
    if (sampleVal.trim()===''){
        return;
    }
    ctx.sampleSize = sampleVal;
    updateScatterPlot();
};
