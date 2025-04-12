// Mobile-friendly SpotifyMusicCard Component
const MusicCard = ({ music, actionType, onAction }) => {
	// Use S3 image URL if available, otherwise use the original image URL
	const imageUrl = music.s3_image_url || music.image_url || '/default-artist.png';

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
				{/* Action button - visible on hover for desktop, always visible on mobile */}
				<div className="absolute bottom-2 right-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
					<button
						onClick={onAction}
						className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110
              ${actionType === 'subscribe' ? 'bg-green-500' : 'bg-red-500'}`}
						aria-label={actionType === 'subscribe' ? 'Subscribe to this song' : 'Remove subscription'}
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

			<div className="flex justify-between items-start">
				<div className="flex-1 min-w-0 pr-2">
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
			</div>
		</div>
	);
};

export default MusicCard;