import React from 'react'

const MusicCard = ({ music, actionType, onAction }) => {
	// Use S3 image URL if available, otherwise use a placeholder
	const imageUrl = music.s3_image_url || music.image_url || '/default-artist.png';

	// Format the music_id (for display and debugging)
	const musicId = music.music_id || `${music.title}#${music.album}`;

	return (
		<div className='bg-spotify-light-black rounded-lg overflow-hidden shadow-md transition-all hover:shadow-lg hover:translate-y-1'>
			<div className="h-44 overflow-hidden">
				<img
					src={imageUrl}
					alt={`${music.artist} - ${music.title}`}
					className="w-full h-full object-cover transition-transform hover:scale-105"
					onError={(e) => {
						e.target.onerror = null;
						e.target.src = '/default-artist.png';
					}}
				/>
			</div>

			<div className="p-4 flex-grow">
				<h3 className="text-lg font-semibold text-gray-800 truncate" title={music.title}>
					{music.title}
				</h3>
				<p className="text-sm text-gray-600 truncate" title={music.artist}>
					{music.artist}
				</p>
				<p className="text-sm text-gray-600 truncate" title={music.album}>
					{music.album}
				</p>
				<p className="text-sm text-gray-600 mb-3">
					{music.year}
				</p>

				{actionType === 'subscribe' ? (
					<button
						className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
						onClick={onAction}
						title="Subscribe to this song"
					>
						Subscribe
					</button>
				) : (
					<button
						className="w-full py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
						onClick={onAction}
						title="Remove from subscriptions"
					>
						Remove
					</button>
				)}
			</div>
		</div>
	)
}

export default MusicCard
