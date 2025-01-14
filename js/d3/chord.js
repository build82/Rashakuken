/* 
 * Copyright Notice 
 * 
 * COPYRIGHT© 2021 Build 82. All rights reserved. No part of this software
 * and constituent code may be reproduced in any form, including video recording, 
 * photocopying, downloading, broadcasting or transmission electronically, without 
 * prior written consent of Build 82. Copyright protection includes output
 * generated by this software as displayed in print or in digital form, such as 
 * icons, interfaces, and the like. 
 * 
 * Content Warranty 
 * 
 * The information in this document is subject to change without notice. THIS 
 * DOCUMENT IS PROVIDED "AS IS" AND BUILD 82 MAKES NO WARRANTY, EXPRESS, 
 * IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO ALL WARRANTIES OF 
 * MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE OR NONINFRINGEMENT. 
 * Build 82 shall not be liable for errors contained herein or for 
 * incidental or consequential damages in connection with the furnishing, 
 * performance or use of this material.
 */

define(['dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/dom-construct',
	'dijit/_Widget', 
	'dijit/_Templated',
	'build82/d3'
	], 
    function(declare, lang, domConstruct, _Widget, _Templated, d3) {
		var draw = function() {
			var self = this;
			domConstruct.empty(this.chartNode);
			this.svg = d3.select(this.chartNode).append('svg').attr('viewBox', [-this.width / 2, -this.height / 2, this.width, this.height]);
			
			this.radius.outer = Math.min(this.width, this.height) * 0.5 - 60;
			this.radius.inner = this.radius.outer - 10;
						
			var color = d3.scaleOrdinal(this.names, this.colors);
			var ribbon = d3.ribbon()
				.radius(this.radius.inner - 1)
				.padAngle(1 / this.radius.inner);
		
			const arc = d3.arc()
				.innerRadius(this.radius.inner)
				.outerRadius(this.radius.outer);
		
			const chord = d3.chord()
				.padAngle(10 / this.radius.inner)
				.sortSubgroups(d3.descending)
				.sortChords(d3.descending);
		
			const formatValue = d3.format('.1~%');
			
			var chords = chord(this.data);
			
			var group = this.svg.append('g')
				.attr('font-size', 10)
				.attr('font-family', 'sans-serif')
				.selectAll('g')
				.data(chords.groups)
				.join('g');
		
			group.append('path')
				.attr('fill', d => color(self.names[d.index]))
				.attr('d', arc);
		
			group.append('title')
				.text(d => `${self.format.tooltip(self.names[d.index])} ${formatValue(d.value)}`);
		
			var groupTick = group.append('g')
				.selectAll('g')
				.data(lang.hitch(this, ticks))
				.join('g')
				.attr('transform', d => `rotate(${d.angle * 180 / Math.PI - 90}) translate(${this.radius.outer},0)`);
		
			groupTick.append('line')
				.attr('stroke', 'currentColor')
				.attr('x2', 6);
		
			groupTick.append('text')
				.attr('x', 8)
				.attr('dy', '0.35em')
				.attr('transform', d => d.angle > Math.PI ? 'rotate(180) translate(-16)' : null)
				.attr('text-anchor', d => d.angle > Math.PI ? 'end' : null)
				.text(d => formatValue(d.value));
		
			group.select('text')
				.attr('font-weight', 'bold')
				.text(function(d) {
					return this.getAttribute('text-anchor') === 'end'
						? `↑ ${self.format.title(self.names[d.index])}`
						: `${self.format.title(self.names[d.index])} ↓`;
					}
				);
					
			this.svg.append('g')
				.attr('fill-opacity', 0.8)
				.selectAll('path')
				.data(chords)
				.join('path')
				.style('mix-blend-mode', 'multiply')
				.attr('fill', d => color(self.names[d.source.index]))
				.attr('d', ribbon)
				.append('title')
				.text(d => `${formatValue(d.source.value)} ${self.format.tooltip(self.names[d.target.index])} → ${self.format.tooltip(self.names[d.source.index])}${d.source.index === d.target.index ? '' : `\n${formatValue(d.target.value)} ${self.format.tooltip(self.names[d.source.index])} → ${self.format.tooltip(self.names[d.target.index])}`}`);
		},
				
		ticks = function({startAngle, endAngle, value}) {
			const k = (endAngle - startAngle) / value;
			const tickStep = d3.tickStep(0, d3.sum(this.data.flat()), 100);
			
			return d3.range(0, value, tickStep).map(value => {
				return {value, angle: value * k + startAngle};
			});
		},
				
		updateChart = function(param_obj) {
			if(param_obj.data) {
				this.data = this.compute(param_obj.data);
			}

			lang.hitch(this, draw)();
		};
		
		return declare([_Widget, _Templated], {
			baseClass: 'chart-d3-chord',
			chartNode: null,
			width: 500,
			height: 500,
			data: null,
			margin: {top: 20, right: 20, bottom: 30, left: 40},
			svg: null,
			radius: {
				inner: null,
				outer: null
			},
			colors: null,
			names: null,
			format: {
				title: t => t,
				tooltip: t => t
			},
			templateString: '<div data-dojo-attach-point="chartNode"></div>',
			compute: function(param_data) {
				return param_data;
			},
			postCreate: function() {
				this.inherited(arguments);

				this.names = this.names === null ? d3.range(this.data.length) : this.names;
				this.colors = this.colors === null ? d3.quantize(d3.interpolateRainbow, this.names.length) : this.colors;
				this.data = this.compute(this.data);
				lang.hitch(this, draw)();
			},
			redraw: function(param_height, param_width) {
				this.height = param_height;
				this.width = param_width;
				
				lang.hitch(this, draw)();
			},
			update: updateChart
		});
	}
);
