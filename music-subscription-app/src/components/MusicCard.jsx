import React from 'react'

const MusicCard = ({ music, actionType, onAction }) => {
	// Use S3 image URL if available, otherwise use a placeholder
	const imageUrl = music.s3_image_url || music.image_url || '/default-artist.png';

	// Format the music_id (for display and debugging)
	const musicId = music.music_id || `${music.title}#${music.album}`;

	return (
		<div className="bg-[#181818] rounded-md p-4 hover:bg-[#282828] transition-colors group">
			<div className="relative mb-4">
				<img
					src={imageUrl}
					alt={`${music.artist} - ${music.title}`}
					className="w-full aspect-square object-cover rounded-md shadow-lg"
					onError={(e) => {
						e.target.onerror = null;
						e.target.src = '/default-artist.png';
					}}
				/>
				<div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
					<button
						onClick={onAction}
						className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110
              ${actionType === 'subscribe' ? 'bg-green-500' : 'bg-red-500'}`}
					>
						{actionType === 'subscribe' ? (
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
						) : (
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						)}
					</button>
				</div>
			</div>

			<h3 className="font-bold text-white truncate" title={music.title}>
				{music.title}
			</h3>
			<p className="text-sm text-gray-400 truncate mt-1" title={music.artist}>
				{music.artist}
			</p>
			<div className="flex justify-between items-center mt-2 text-xs text-gray-400">
				<span>{music.year}</span>
				<span className="truncate max-w-[70%] text-right" title={music.album}>{music.album}</span>
			</div>
		</div>
	);
}

export default MusicCard
