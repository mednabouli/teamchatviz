import React from 'react';
import moment from 'moment';
import d3 from 'd3';
import { xScale, yScale } from 'client/d3-components/Scales.js';
import { Map } from 'immutable';
import _ from 'lodash';
import PointGroup from 'client/d3-components/PointGroup.js';
import ReactDOM from 'react-dom';
import Hull from 'client/d3-components/Hull.js';
import Tooltip from 'client/d3-components/Tooltip.js';

export default React.createClass({
  propTypes: {
    showTooltipFor: React.PropTypes.string,
  },
  getInitialState() {
    return {
      data: Map({
        tooltip: {
          display: false,
          name: '',
          x: 0,
          y: 0,
        },
        zoom: 1,
      })
    };
  },
  showTooltip(e) {
    var tooltip = {
      display: true,
      name: e.target.getAttribute('data-name'),
      x: e.target.getAttribute('cx'),
      y: e.target.getAttribute('cy'),
    };
    this.setState(({data}) => ({
      data: data.update('tooltip', () => tooltip)
    }));
  },

  hideTooltip(e) {
    this.setState(({data}) => ({
      data: data.update('tooltip', () => ({
        display:false,
        name: '',
        x: 0,
        y: 0,
      }))
    }));
  },

  componentDidMount: function() {
    this.updateZoom = _.debounce((zoom) => {
      this.setState(({data}) => ({
        data: data.update('zoom', () => zoom)
      }));
    }, 200);
    var el = ReactDOM.findDOMNode(this);
    var selection = d3.select(el).select('g');
    var zoom = d3.behavior.zoom()
      .scaleExtent([1, 10])
      .on('zoom', this.onZoom);
    selection.call(zoom);
  },

  onZoom() {
    var el = ReactDOM.findDOMNode(this);
    var selection = d3.select(el).select('g');
    var zoom = d3.event.scale;
    this.updateZoom(zoom);
    selection.attr('transform', 'translate(' + d3.event.translate + ')scale(' + zoom + ')')
  },

  render() {
    const props = this.props;
    const showTooltipFor = this.props.showTooltipFor;
    let tooltip = this.state.data.get('tooltip');
    const scales = { xScale: xScale(props), yScale: yScale(props) };
    if (showTooltipFor && tooltip.display === false) {
      const member = props.data.find(item => item.id == showTooltipFor);
      if (member) {
        tooltip = {
          display: true,
          name: member.name,
          x: scales.xScale(member.x),
          y: scales.yScale(member.y),
        };
      } else {
        tooltip = {
          display: false,
          name: '',
          x: 0,
          y: 0,
        };
      }
    }
    const points = props.data;
    const groups = _.groupBy(props.data, 'group');
    const hulls = Object.keys(groups).map(key => {
      const points = groups[key].map(p => [scales.xScale(p.x), scales.yScale(p.y)]);
      return <Hull points={points} color={groups[key][0].color} />
    });
    return <svg width={props.width} height={props.height}>
      <g>
        {
          hulls
        }
        <PointGroup
          zoom={this.state.data.get('zoom')}
          {...props}
          {...scales}
          point={this.props.point}
          showTooltip={this.showTooltip}
          hideTooltip={this.hideTooltip} />
        <Tooltip zoom={this.state.data.get('zoom')} tooltip={tooltip} />
      </g>
    </svg>
  }
});