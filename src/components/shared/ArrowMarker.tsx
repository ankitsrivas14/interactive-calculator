const ArrowMarker = () => (
    <svg style={{ width: 0, height: 0, position: 'absolute' }}>
      <defs>
        <marker
          id="arrow"
          markerWidth="30"
          markerHeight="30"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
          viewBox="0 0 20 20">
          <path d="M0,0 L0,6 L9,3 z" fill="#2f2f2f" />
        </marker>
      </defs>
    </svg>
);

export default ArrowMarker;