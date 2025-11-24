import React, { useState, useEffect, useRef } from 'react';
import { Scrollama, Step } from 'react-scrollama';
import HeatMap from './heatmap';
import LineChart from './linechart';

// This hook sets the dimensions of the current div
const useResizeObserver = (ref) => {
  const [dimensions, setDimensions] = useState(null);
  useEffect(() => {
    const observeTarget = ref.current;
    if(!observeTarget) return;
    
    // Set dimensions based on the divs current size 
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        setDimensions(entry.contentRect);
      });
    });
    
    resizeObserver.observe(observeTarget);
    return () => resizeObserver.unobserve(observeTarget);
  }, [ref]);
  return dimensions;
};

// Sub-Component, Handles one Graph Step
const GraphStep = ({ index, currentStepIndex }) => {
    const containerRef = useRef(null);
    // Get the live width/height of this specific div
    const dimensions = useResizeObserver(containerRef);

    return (
        <div className={`flex w-screen h-[80vh] mb-20 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse' }`}>
            
            {/* Graph Section */}
            <div className="w-2/3 flex items-center justify-center">
                <div 
                    ref={containerRef} 
                    className={`w-11/12 h-5/6 transition-all duration-700 border-4 relative
                    ${index % 2 === 0 ? ' border-amber-500' : ' border-blue-500'}
                    ${currentStepIndex === index ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}
                    `}
                >
                    {(dimensions && index === 2) && (
                        <LineChart 
                            width={dimensions.width} 
                            height={dimensions.height} 
                        />
                    )}
                    {/* Only render HeatMap if we have dimensions */}
                    {(dimensions && index === 3) && (
                        <HeatMap 
                            width={dimensions.width} 
                            height={dimensions.height} 
                        />
                    )}
                    {/* FIXME: add options for the other graphs, ex:  */}
                    {/* {(dimensions && index === <NUM CORRESPONDING TO YOUR GRAPH>) && (
                        <YOUR GRAPH COMPONENT>
                    )} */}
                </div>
            </div>

            {/* Text Blurb */}
            <div className="w-1/3 flex items-center justify-center relative overflow-hidden">
                <div className={`w-10/12 transition-all duration-700 text-lg font-medium
                ${currentStepIndex === index ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}
                `}>
                    {index === 0 && (
                        <p className='text-black'>Insert Description.</p>
                    )}
                    {index === 1 && (
                        <p className='text-black'>Insert Description.</p>
                    )}
                    {index === 2 && (
                        <p className='text-black'>Line chart Description.</p>
                    )}
                    {index === 3 && (
                        <p className='text-black'>Heat map description.</p>
                    )}
                    {index === 4 && (
                        <p className='text-black'>Insert Description.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// Main Component 
const ScrollamaDemo = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(null);

  const onStepEnter = ({ data }) => {
    setCurrentStepIndex(data);
  };

  return (
      <div className="py-[10vh] bg-white">
        <div className="flex top-0 border-2 justify-center"> 
            <h1 className='text-4xl text-black'>Computer Story</h1>
        </div>
        <Scrollama offset={0.6} onStepEnter={onStepEnter}>
            {[0, 1, 2, 3, 4].map((i) => (
                <Step data={i} key={i}>
                    {/* We pass the props down to our new wrapper */}
                    <div> 
                        <GraphStep index={i} currentStepIndex={currentStepIndex} />
                    </div>
                </Step>
        ))}
      </Scrollama>
    </div>
  );
};

export default ScrollamaDemo;