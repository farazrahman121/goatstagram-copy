import React from 'react';

const ActorCardComponent = ({imagePath}) => {
  const cleanedPath = imagePath.replace("imdb_crop/", "");
  const finalPath = "https://nets2120-images.s3.amazonaws.com/" + cleanedPath;
  return (
    <div className="actor-card">
      {imagePath && <img src={finalPath} alt={cleanedPath} className="actor-image"/>}
    </div>
  );
};

export default ActorCardComponent;
