/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "res.cloudinary.com",
			},
			{
				protocol: "https",
				hostname: "images.unsplash.com",
			},
			{
				protocol: "http",
				hostname: "localhost",
				port: "5000",
			},
			{
				protocol: "https",
				hostname: "localhost",
			},
		],
	},
}

export default nextConfig
