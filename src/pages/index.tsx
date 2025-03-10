import { useState } from "react";
import { Geist } from "next/font/google";
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Chip,
	Input,
	Progress,
} from "@nextui-org/react";
import {
	Lock,
	Unlock,
	AlertTriangle,
	Terminal,
	Database,
	Zap,
	Clock,
	Hash,
	RefreshCw,
	ShieldAlert,
	KeyRound,
	Users,
	User,
	GraduationCap,
	BookOpen,
	Github,
} from "lucide-react";
import confetti from "canvas-confetti";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
	Stats,
	calculatePasswordStats,
	formatPercentage,
	generateWorkerCode,
} from "../utils/passwordUtils";
import Link from "next/link";
import { Tooltip } from "@nextui-org/react";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

declare global {
	interface Window {
		confetti: typeof confetti;
	}
}

export default function Home() {
	let startTime: number;
	const [password, setPassword] = useState("");
	const [isHacking, setIsHacking] = useState(false);
	const [progress, setProgress] = useState(0);
	const [currentAttempt, setCurrentAttempt] = useState("");
	const [foundPassword, setFoundPassword] = useState(false);
	const [attemptCount, setAttemptCount] = useState(0);
	const [currentLength, setCurrentLength] = useState(4);
	const [stats, setStats] = useState<Stats>({
		totalPossibleCombinations: 0,
		totalPossibleAll: 0,
		fourLetterCombinations: 0,
		fourLetterPercentage: 0,
		timeEstimation: "",
		currentStrategy: "",
		possibleCombinationsInfo: {},
		specificLengthPercentage: 0,
	});
	const [isRealAttempt, setIsRealAttempt] = useState(false);
	const [showModeSelection, setShowModeSelection] = useState(false);
	const [elapsedTime, setElapsedTime] = useState<string>("");

	const SIMULATION_TIME = 10000; // 10 segundos
	const UPDATES_PER_SECOND = 20; // Aumentamos las actualizaciones para más fluidez

	const showAlert = (message: string) => {
		toast.error(message, {
			position: "top-right",
			autoClose: 3000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
			theme: "dark",
			style: {
				background: "rgba(26, 27, 46, 0.9)",
				borderLeft: "4px solid #3b82f6",
				backdropFilter: "blur(10px)",
				color: "#3b82f6",
			},
		});
	};

	const realBruteForce = async () => {
		return new Promise((resolve) => {
			const workerCode = generateWorkerCode();
			const blob = new Blob([workerCode], { type: "application/javascript" });
			const worker = new Worker(URL.createObjectURL(blob));
			const timeLimit = isRealAttempt ? Infinity : SIMULATION_TIME;
			let progressInterval: NodeJS.Timeout;

			// Si es simulación, actualizamos la barra de progreso independientemente
			if (!isRealAttempt) {
				progressInterval = setInterval(() => {
					const elapsedTime = Date.now() - startTime;
					const progress = Math.min((elapsedTime / SIMULATION_TIME) * 100, 99);
					setProgress(progress);
				}, 50);
			}

			worker.onmessage = (e) => {
				const { type, attempts, current, progress, password } = e.data;
				const elapsedTime = Date.now() - startTime;

				// Si excedemos el tiempo límite en simulación
				if (!isRealAttempt && elapsedTime >= SIMULATION_TIME) {
					if (progressInterval) clearInterval(progressInterval);
					worker.terminate();
					setCurrentAttempt("Simulación completada");
					setProgress(100);
					setStats((prev) => ({
						...prev,
						currentStrategy: "Simulación finalizada",
					}));
					resolve(true);
					return;
				}

				switch (type) {
					case "progress":
						setCurrentAttempt(current);
						setAttemptCount(attempts);
						if (isRealAttempt) setProgress(progress);
						const timeElapsed = (elapsedTime / 1000).toFixed(2);
						setElapsedTime(`${timeElapsed}s`);
						setStats((prev) => ({
							...prev,
							currentStrategy: (
								<div className="flex items-center gap-2">
									<span>Probando combinación {attempts.toLocaleString()}</span>
									<Clock className="text-white/90 w-4 h-4" />
									<span>({timeElapsed}s)</span>
								</div>
							),
						}));
						break;

					case "found":
						if (progressInterval) clearInterval(progressInterval);
						worker.terminate();
						setCurrentAttempt(password);
						setAttemptCount(attempts);
						setProgress(100);
						resolve(true);
						break;

					case "notFound":
						if (progressInterval) clearInterval(progressInterval);
						worker.terminate();
						setStats((prev) => ({
							...prev,
							currentStrategy: "Contraseña no encontrada",
						}));
						resolve(false);
						break;
				}
			};

			worker.onerror = (error) => {
				if (progressInterval) clearInterval(progressInterval);
				console.error("Error en el worker:", error);
				worker.terminate();
				resolve(false);
			};

			worker.postMessage({
				password: password,
				maxLength: password.length,
				timeLimit: timeLimit,
			});
		});
	};

	const startHacking = async () => {
		if (password.length < 4 || password.length > 8) {
			showAlert("La contraseña debe tener entre 4 y 8 caracteres");
			return;
		}

		const stats = calculatePasswordStats(password.length);
		if (stats.timeEstimation.includes("años") && !isRealAttempt) {
			showAlert(
				"Se recomienda usar el modo simulación para contraseñas largas"
			);
		}

		setShowModeSelection(true);
	};

	const handleModeSelection = async (isReal: boolean) => {
		setIsRealAttempt(isReal);
		setShowModeSelection(false);
		startTime = Date.now();
		setIsHacking(true);
		setProgress(0);
		setFoundPassword(false);
		setAttemptCount(0);
		setCurrentLength(password.length);
		setStats((prev) => ({
			...calculatePasswordStats(password.length),
			currentStrategy: isReal
				? "Iniciando ataque de fuerza bruta real"
				: "Iniciando simulación de fuerza bruta",
		}));

		try {
			const found = await realBruteForce();

			if (found) {
				const timeElapsed = (Date.now() - startTime) / 1000;
				setProgress(100);
				setFoundPassword(true);
				setStats((prev) => ({
					...prev,
					timeEstimation: `${timeElapsed.toFixed(2)} segundos`,
					currentStrategy: "¡Contraseña encontrada!",
				}));

				confetti({
					particleCount: 100,
					spread: 70,
					origin: { y: 0.6 },
				});
			}
		} catch (error) {
			console.error("Error en el ataque de fuerza bruta:", error);
			showAlert("Error en el proceso de ataque");
		} finally {
			setIsHacking(false);
		}
	};

	const handleReset = () => {
		setPassword("");
		setIsHacking(false);
		setProgress(0);
		setCurrentAttempt("");
		setFoundPassword(false);
		setAttemptCount(0);
		setShowModeSelection(false);
		setElapsedTime("");
		setStats({
			totalPossibleCombinations: 0,
			totalPossibleAll: 0,
			fourLetterCombinations: 0,
			fourLetterPercentage: 0,
			timeEstimation: "",
			currentStrategy: "",
			possibleCombinationsInfo: {},
			specificLengthPercentage: 0,
		});
	};

	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (isHacking) {
			toast.warning("Debes reiniciar el proceso para cambiar la contraseña", {
				position: "top-right",
				autoClose: 3000,
				theme: "dark",
				style: {
					background: "rgba(26, 27, 46, 0.9)",
					borderLeft: "4px solid #eab308",
					backdropFilter: "blur(10px)",
					color: "#eab308",
				},
			});
			return;
		}

		const value = e.target.value;
		if (value === "" || /^[a-zA-Z]*$/.test(value)) {
			setPassword(value);
		}
	};

	return (
		<>
			<ToastContainer />
			<div
				className={`${geistSans.variable} min-h-screen bg-[#1a1b2e] text-white`}>
				{/* Grid sutil */}
				<div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px] pointer-events-none" />

				{/* Gradientes suaves */}
				<div
					className="absolute inset-0 bg-gradient-to-br from-[#1a1b2e] via-[#2a3150] to-[#1a1b2e]"
					style={{ mixBlendMode: "overlay" }}
				/>

				{/* Efectos de luz */}
				<div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-r from-[#3b82f6]/20 via-[#60a5fa]/20 to-[#3b82f6]/20 blur-[100px]" />
				<div className="absolute bottom-0 left-0 right-0 h-[500px] bg-gradient-to-r from-[#e2e8f0]/20 via-[#f8fafc]/20 to-[#e2e8f0]/20 blur-[100px]" />

				<div className="relative max-w-4xl mx-auto p-8 space-y-8">
					<Card className="border border-[#3b82f6]/30 bg-[#1a1b2e]/50 backdrop-blur-xl">
						<CardHeader className="flex flex-col gap-3">
							<div className="flex items-center gap-2 w-full justify-between px-4">
								<div className="flex items-center gap-2">
									<div className="w-3 h-3 rounded-full bg-[#3b82f6] animate-pulse" />
									<div className="w-3 h-3 rounded-full bg-[#60a5fa] animate-pulse delay-75" />
									<div className="w-3 h-3 rounded-full bg-[#93c5fd] animate-pulse delay-150" />
								</div>
								<Terminal className="text-[#3b82f6] w-6 h-6" />
							</div>
							<div className="text-center space-y-2">
								<h1 className="text-3xl font-bold bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] bg-clip-text text-transparent">
									Sistema de Recuperación de Acceso
								</h1>
								<div className="flex items-center justify-center gap-2 text-[#3b82f6]">
									<ShieldAlert className="w-5 h-5 animate-pulse" />
									<p className="text-sm">Protocolo de Seguridad Nivel ITM</p>
								</div>
							</div>
						</CardHeader>
						<CardBody className="space-y-4">
							<div className="flex items-start gap-3 border-l-4 border-[#3b82f6] pl-4 bg-[#3b82f6]/5 rounded-r-lg p-4">
								<AlertTriangle className="text-[#3b82f6] shrink-0 animate-pulse w-6 h-6" />
								<div className="space-y-2">
									<p className="text-[#3b82f6] font-semibold">
										ALERTA DE SEGURIDAD
									</p>
									<p className="text-sm text-[#3b82f6]/80">
										Acceso no autorizado detectado en el servidor principal.
									</p>
									<p className="text-sm text-[#3b82f6]/80">
										Se requiere recuperación inmediata del sistema.
									</p>
								</div>
							</div>
						</CardBody>
					</Card>

					<Card className="border border-[#3b82f6]/30 bg-[#1a1b2e]/50 backdrop-blur-xl">
						<CardBody className="space-y-6">
							<div className="relative">
								<Input
									type="password"
									label="CONTRASEÑA OBJETIVO"
									placeholder="4-8 caracteres [A-Z, a-z]"
									value={password}
									onChange={handlePasswordChange}
									maxLength={8}
									isDisabled={isHacking || foundPassword}
									className="max-w-full"
									classNames={{
										input: "text-center font-mono text-white font-bold",
										label: "text-[#3b82f6]",
										inputWrapper:
											"bg-[#1a1b2e]/50 border-[#3b82f6]/50 backdrop-blur-xl",
									}}
									startContent={<Lock className="text-[#3b82f6] w-5 h-5" />}
								/>
							</div>

							<div className="flex gap-2">
								<Button
									color="primary"
									onClick={startHacking}
									isDisabled={isHacking}
									className="w-full relative overflow-hidden group bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] hover:from-[#60a5fa] hover:to-[#3b82f6] transition-all duration-300"
									size="lg"
									startContent={
										isHacking ? (
											<RefreshCw className="w-6 h-6 animate-spin" />
										) : (
											<Zap className="w-6 h-6" />
										)
									}>
									<span className="relative z-10 font-bold text-white">
										{isHacking
											? "DESCIFRANDO..."
											: "INICIAR PROCESO DE RECUPERACIÓN"}
									</span>
								</Button>

								{(isHacking || foundPassword) && (
									<Button
										color="default"
										onClick={handleReset}
										className="bg-gray-700 hover:bg-gray-600 min-w-[100px]"
										size="lg"
										startContent={
											<RefreshCw className="text-white/90 w-6 h-6" />
										}></Button>
								)}
							</div>
						</CardBody>
					</Card>

					{isHacking && (
						<Card className="border border-[#3b82f6]/30 bg-[#1a1b2e]/50 backdrop-blur-xl">
							<CardBody className="space-y-6">
								<div className="space-y-2">
									<div className="flex justify-between items-center">
										<div className="flex items-center gap-2">
											<Terminal className="text-[#3b82f6] w-5 h-5" />
											<span
												className={`text-white/90 ${
													isRealAttempt ? "text-red-400/90" : ""
												}`}>
												{isRealAttempt
													? "PROGRESO DE ATAQUE REAL"
													: "PROGRESO DE SIMULACIÓN"}
											</span>
										</div>
										<Chip
											variant="flat"
											className="bg-[#3b82f6]/20 text-[#3b82f6]"
											startContent={
												<RefreshCw className="w-4 h-4 animate-spin" />
											}>
											{progress.toFixed(2)}%
										</Chip>
									</div>
									<Progress
										value={progress}
										className="h-2"
										classNames={{
											indicator: "bg-gradient-to-r from-[#3b82f6] to-[#60a5fa]",
										}}
									/>
								</div>

								<div className="space-y-4">
									<div className="text-center">
										<p className="text-white/90 mb-2 flex items-center justify-center gap-2">
											<div className="flex items-center gap-2">
												<Database className="text-white/90 w-4 h-4" />
												<p className="text-white/90">Estrategia actual:</p>
											</div>
										</p>
										<Chip
											variant="flat"
											className="bg-white/20 text-white"
											startContent={<KeyRound className="w-4 h-4" />}>
											{stats.currentStrategy}
										</Chip>
									</div>

									<div className="font-mono text-xl bg-white/10 p-6 rounded-lg border border-white/30 backdrop-blur-xl">
										<div className="flex justify-between items-center mb-4">
											<span className="text-sm text-white/90">
												Último intento:
											</span>
											<span className="text-sm text-white/90">
												{attemptCount.toLocaleString()} intentos totales
											</span>
										</div>
										<div className="text-center text-white font-bold tracking-wider">
											{currentAttempt}
										</div>
									</div>

									<div className="grid grid-cols-2 gap-4 text-sm">
										<div className="p-4 rounded-lg bg-white/10 border border-white/30 backdrop-blur-xl">
											<div className="flex items-center gap-2 mb-2">
												<div className="flex items-center gap-2">
													<Hash className="text-white/90 w-4 h-4" />
													<p className="text-white/90">Longitud actual:</p>
												</div>
											</div>
											<p className="font-mono text-white font-bold">
												{currentLength} caracteres
											</p>
										</div>
										<div className="p-4 rounded-lg bg-white/10 border border-white/30 backdrop-blur-xl">
											<div className="flex items-center gap-2 mb-2">
												<div className="flex items-center gap-2">
													<Clock className="text-white/90 w-4 h-4" />
													<p className="text-white/90">Intentos:</p>
												</div>
											</div>
											<p className="font-mono text-white font-bold">
												{attemptCount.toLocaleString()}
											</p>
										</div>
									</div>
								</div>
							</CardBody>
						</Card>
					)}

					{foundPassword && (
						<Card className="border border-[#3b82f6]/40 bg-[#3b82f6]/5 backdrop-blur-xl">
							<CardHeader>
								<div className="w-full flex items-center justify-center gap-3">
									<Unlock className="text-[#3b82f6] w-7 h-7 animate-pulse" />
									<h2 className="text-2xl font-bold text-[#3b82f6]">
										¡ACCESO RECUPERADO!
									</h2>
								</div>
							</CardHeader>
							<CardBody className="space-y-6">
								<div className="text-center bg-[#3b82f6]/10 p-6 rounded-lg border border-[#3b82f6]/40">
									<p className="text-xl font-mono text-[#3b82f6]">{password}</p>
								</div>

								<div className="space-y-4">
									<div className="p-4 rounded-lg bg-[#1a1b2e]/70 border border-[#3b82f6]/30">
										<h3 className="text-lg font-bold text-[#3b82f6] mb-3">
											Análisis de Seguridad
										</h3>

										<div className="space-y-4">
											<div className="bg-[#1a1b2e]/50 p-4 rounded-lg">
												<h4 className="text-white/90 font-semibold mb-2">
													Escenario:
												</h4>
												<p className="text-sm text-white/80">
													Un grupo de hackers ha comprometido el servidor de una
													empresa debido a malas prácticas de seguridad. La
													contraseña del administrador debe tener entre 4 y 8
													caracteres, usando solo letras mayúsculas y
													minúsculas.
												</p>
											</div>

											<div className="bg-[#1a1b2e]/50 p-4 rounded-lg">
												<h4 className="text-white/90 font-semibold mb-2">
													Análisis de Posibilidades:
												</h4>
												<div className="space-y-2">
													<div className="flex justify-between items-center">
														<span className="text-white/80">
															Total de combinaciones posibles:
														</span>
														<span className="font-mono text-[#3b82f6]">
															{stats.totalPossibleAll.toLocaleString()}
														</span>
													</div>
												</div>
											</div>

											<div className="bg-[#1a1b2e]/50 p-4 rounded-lg">
												<h4 className="text-white/90 font-semibold mb-2">
													Principios de Conteo:
												</h4>
												<p className="text-sm text-white/80">
													Utilizamos el principio multiplicativo: para cada
													posición tenemos 52 opciones (26 minúsculas + 26
													mayúsculas). El total de posibilidades para cada
													longitud es 52^n, donde n es la longitud de la
													contraseña.
												</p>
											</div>
										</div>
									</div>

									<div className="bg-[#1a1b2e]/50 p-4 rounded-lg mt-4">
										<h4 className="text-white/90 font-semibold mb-2">
											Distribución por Longitud:
										</h4>
										{Object.entries(stats.possibleCombinationsInfo).map(
											([length, combinations]) => {
												const percentage =
													(combinations / stats.totalPossibleAll) * 100;
												return (
													<div
														key={length}
														className="flex justify-between items-center mb-2">
														<span className="text-white/80">
															{length} caracteres (
															{combinations.toLocaleString()} combinaciones):
														</span>
														<div className="flex gap-4">
															<span className="font-mono text-[#3b82f6]">
																{formatPercentage(percentage)}% del total
															</span>
														</div>
													</div>
												);
											}
										)}

										<div className="mt-4 p-4 bg-[#3b82f6]/10 rounded-lg border border-[#3b82f6]/30">
											<h4 className="text-white/90 font-semibold mb-2">
												Análisis de la Contraseña Actual:
											</h4>
											<div className="space-y-2">
												<div className="flex justify-between items-center">
													<span className="text-white/80">
														Combinaciones totales para {currentLength}{" "}
														caracteres:
													</span>
													<span className="font-mono text-[#3b82f6]">
														{stats.totalPossibleCombinations.toLocaleString()}
													</span>
												</div>
												<div className="flex justify-between items-center">
													<span className="text-white/80">
														Porcentaje del espacio total de búsqueda:
													</span>
													<span className="font-mono text-[#3b82f6]">
														{formatPercentage(stats.specificLengthPercentage)}%
													</span>
												</div>
												<div className="flex justify-between items-center">
													<span className="text-white/80">
														Contraseñas de 4 caracteres (base de comparación):
													</span>
													<span className="font-mono text-[#3b82f6]">
														{stats.fourLetterCombinations.toLocaleString()} (
														{formatPercentage(stats.fourLetterPercentage)}% del
														total)
													</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							</CardBody>
						</Card>
					)}

					{showModeSelection && (
						<Card className="fixed inset-0 m-auto w-96 h-fit z-50 border border-[#3b82f6]/30 bg-[#1a1b2e]/95 backdrop-blur-xl">
							<CardHeader className="flex justify-between items-center">
								<h3 className="text-xl font-bold text-[#3b82f6]">
									Seleccionar Modo de Ataque
								</h3>
								<Button
									isIconOnly
									size="sm"
									variant="light"
									className="text-white/50 hover:text-white"
									onClick={() => setShowModeSelection(false)}>
									<svg
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2">
										<line x1="18" y1="6" x2="6" y2="18"></line>
										<line x1="6" y1="6" x2="18" y2="18"></line>
									</svg>
								</Button>
							</CardHeader>
							<CardBody className="space-y-4">
								<div className="bg-[#3b82f6]/10 p-4 rounded-lg border border-[#3b82f6]/30">
									<p className="text-sm text-[#3b82f6] font-bold">
										¡ADVERTENCIA! Modo Real
									</p>
									<p className="text-sm text-[#3b82f6] mt-2">
										Este modo realizará un ataque de fuerza bruta real probando
										cada combinación posible:
									</p>
									<ul className="text-sm text-[#3b82f6]/80 list-disc list-inside mt-2">
										<li>4 caracteres: ~10-30 segundos</li>
										<li>5 caracteres: ~15-30 minutos</li>
										<li>6 caracteres: ~12-24 horas</li>
										<li>7 caracteres: ~1-2 meses</li>
										<li>8 caracteres: ~varios años</li>
									</ul>
									<p className="text-sm text-[#3b82f6] mt-2">
										No se recomienda usar con contraseñas de más de 5
										caracteres.
									</p>
									<p className="text-sm text-[#3b82f6] mt-4 p-2 bg-[#3b82f6]/10 rounded-lg border border-[#3b82f6]/30">
										Prueba recomendada: &quot;ZbcAA&quot; (30 segundos aprox.)
									</p>
								</div>

								<Button
									color="primary"
									onClick={() => handleModeSelection(false)}
									className="w-full bg-gradient-to-r from-[#3b82f6] to-[#60a5fa]">
									Modo Simulación (10 segundos)
								</Button>

								<Button
									color="default"
									onClick={() => handleModeSelection(true)}
									className="w-full bg-red-800/40 hover:bg-red-700/50 border border-red-500/30 backdrop-blur-sm text-white">
									<div className="flex items-center gap-2 justify-center w-full">
										<AlertTriangle className="w-5 h-5 text-red-400" />
										<span>Modo Real (¡Puede tomar mucho tiempo!)</span>
									</div>
								</Button>
							</CardBody>
						</Card>
					)}

					{/* Sección de Créditos */}
					<Card className="border border-[#3b82f6]/30 bg-[#1a1b2e]/50 backdrop-blur-xl mt-8">
						<CardHeader className="border-b border-[#3b82f6]/20">
							<div className="flex items-center justify-center gap-3 w-full">
								<Users className="w-6 h-6 text-[#3b82f6]" />
								<h3 className="text-xl font-bold bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] bg-clip-text text-transparent">
									Equipo de Desarrollo
								</h3>
							</div>
						</CardHeader>
						<CardBody>
							<div className="text-center space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-4">
										<div className="flex items-center gap-3 bg-[#1a1b2e]/70 p-3 rounded-lg border border-[#3b82f6]/20">
											<User className="w-5 h-5 text-[#3b82f6]" />
											<p className="text-white/90">Juan Diego Patiño Osorio</p>
										</div>
										<div className="flex items-center gap-3 bg-[#1a1b2e]/70 p-3 rounded-lg border border-[#3b82f6]/20">
											<User className="w-5 h-5 text-[#3b82f6]" />
											<p className="text-white/90">
												José Ricardo Quirós García
											</p>
										</div>
										<div className="flex items-center gap-3 bg-[#1a1b2e]/70 p-3 rounded-lg border border-[#3b82f6]/20">
											<User className="w-5 h-5 text-[#3b82f6]" />
											<p className="text-white/90">
												Diego Armando Ramírez Duque
											</p>
										</div>
									</div>
									<div className="space-y-4">
										<div className="flex items-center gap-3 bg-[#1a1b2e]/70 p-3 rounded-lg border border-[#3b82f6]/20">
											<User className="w-5 h-5 text-[#3b82f6]" />
											<p className="text-white/90">
												Jean Carlos Gonzalez Goyeneche
											</p>
										</div>
										<div className="flex items-center gap-3 bg-[#1a1b2e]/70 p-3 rounded-lg border border-[#3b82f6]/20">
											<User className="w-5 h-5 text-[#3b82f6]" />
											<p className="text-white/90">
												Danny Mateo Hernández Sánchez
											</p>
										</div>
									</div>
								</div>

								<div className="pt-4 border-t border-[#3b82f6]/20">
									<div className="flex flex-col items-center justify-center gap-3">
										<div className="flex items-center gap-2">
											<GraduationCap className="w-5 h-5 text-[#3b82f6]" />
											<span className="text-white/90 font-semibold">
												Universidad ITM
											</span>
										</div>
										<div className="flex items-center gap-2 text-sm text-[#3b82f6]/70">
											<BookOpen className="w-4 h-4" />
											<span>Matemáticas Avanzadas</span>
										</div>
									</div>
								</div>

								<div className="flex justify-center gap-4 pt-2">
									<Tooltip content="Repositorio del Proyecto">
										<Link
											href="https://github.com/dannymateo/robot-hack-password"
											target="_blank"
											className="p-2 rounded-full bg-[#1a1b2e]/70 border border-[#3b82f6]/20 hover:bg-[#3b82f6]/20 transition-colors">
											<Github className="w-5 h-5 text-[#3b82f6]" />
										</Link>
									</Tooltip>
								</div>
							</div>
						</CardBody>
					</Card>
				</div>
			</div>
		</>
	);
}
