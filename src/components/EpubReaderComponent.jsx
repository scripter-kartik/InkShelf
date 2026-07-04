"use client";
import React, { useState, useEffect } from "react";
import { ReactReader } from "react-reader";

export default function EpubReaderComponent({ url, title }) {
  const [location, setLocation] = useState(null);

  return (
    <div className="absolute inset-0 w-full h-full bg-white dark:bg-gray-900 z-10 text-black">
      <ReactReader
        url={url}
        title={title}
        location={location}
        locationChanged={(epubcifi) => setLocation(epubcifi)}
        epubInitOptions={{
          openAs: "epub"
        }}
        styles={{
          container: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          },
          readerArea: {
            position: 'relative',
            zIndex: 1,
            height: '100%',
            width: '100%',
            backgroundColor: '#fff',
            transition: 'all .3s ease'
          },
        }}
      />
    </div>
  );
}
