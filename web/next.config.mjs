/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Dependencias opcionales de WalletConnect que no usamos en el navegador
    config.externals.push("pino-pretty", "lokijs", "encoding");
    // El conector de Base Account (no lo usamos) arrastra el SDK de Coinbase CDP, que no compila.
    // wagmi lo importa de forma dinámica solo al usarlo, así que es seguro desactivarlo.
    // El SDK de MetaMask referencia un módulo de React Native que no existe en la web.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@base-org/account": false,
      "@react-native-async-storage/async-storage": false,
    };
    return config;
  },
};

export default nextConfig;
