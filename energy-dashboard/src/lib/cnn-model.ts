import * as tf from '@tensorflow/tfjs';

export interface ModelMetrics {
    loss: number;
    accuracy: number;
    epoch: number;
}

export class HealthModel {
    private model: tf.Sequential | null = null;
    private isTraining: boolean = false;

    constructor() {
        // Initialize
    }

    // 1. Define Model Architecture
    createModel(): tf.Sequential {
        const model = tf.sequential();

        // Input shape: [100 time-steps, 1 feature (amplitude)]
        model.add(tf.layers.conv1d({
            inputShape: [100, 1],
            kernelSize: 5,
            filters: 16, // Double filters
            strides: 1,
            activation: 'relu',
            kernelInitializer: 'varianceScaling'
        }));

        model.add(tf.layers.maxPooling1d({ poolSize: 2, strides: 2 }));

        model.add(tf.layers.conv1d({
            kernelSize: 3,
            filters: 32, // Double filters
            activation: 'relu',
            kernelInitializer: 'varianceScaling'
        }));

        model.add(tf.layers.maxPooling1d({ poolSize: 2, strides: 2 }));

        model.add(tf.layers.flatten());

        model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
        model.add(tf.layers.dropout({ rate: 0.2 })); // Prevent overfitting on synthetic noise

        // Output: 0.0 (Failing) to 1.0 (Healthy)
        model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

        model.compile({
            optimizer: tf.train.adam(0.001), // Lower learning rate for stability
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });

        this.model = model;
        return model;
    }

    // 2. Generate Synthetic Data
    // Healthy: Clean signature of ANY appliance
    // Failing: Noisy, distorted, drifting signature of ANY appliance
    generateData(numSamples: number): { xs: tf.Tensor, ys: tf.Tensor } {
        return tf.tidy(() => {
            const inputs: number[][][] = [];
            const labels: number[][] = [];

            for (let i = 0; i < numSamples; i++) {
                const isHealthy = Math.random() > 0.5;
                const waveform: number[] = [];

                // Randomly pick an appliance archetype to simulate diversity
                const type = Math.floor(Math.random() * 4); // 0: Laptop, 1: Fan, 2: Monitor, 3: Bulb

                // Base params
                const phase = Math.random() * Math.PI * 2;
                // Degraded traits
                const noiseLevel = isHealthy ? 2 : 25 + Math.random() * 20;
                const distortion = isHealthy ? 0.05 : 1.5 + Math.random(); // Healthy has tiny natural distortion
                const drift = isHealthy ? 0 : (Math.random() - 0.5) * 40;

                for (let t = 0; t < 100; t++) {
                    const time = t * 0.1;
                    let val = 0;

                    // 1. Base Signature Generation
                    if (type === 0) { // Laptop (SMPS)
                        let sine = Math.sin(time + phase);
                        val = (sine > 0 ? Math.pow(sine, 3) : -Math.pow(Math.abs(sine), 3)) * 60;
                    } else if (type === 1) { // Fan (Inductive)
                        val = Math.sin(time + phase - 0.5) * 45 + Math.sin((time + phase) * 3) * 5;
                    } else if (type === 2) { // Monitor (Square-ish)
                        let sine = Math.sin(time + phase);
                        val = Math.sign(sine) * 40 * (1 - Math.exp(-Math.abs(sine) * 5));
                    } else { // Bulb (Resistive)
                        val = Math.sin(time + phase) * 15;
                    }

                    if (!isHealthy) {
                        // Add heavy harmonic distortion typical of failing caps
                        val += Math.sin(time * 5) * distortion * 5;
                        val += Math.sin(time * 7) * distortion * 2;
                        val += drift; // DC Offset
                    }

                    // Add Noise (Bearings grinding, Arcing)
                    val += (Math.random() - 0.5) * noiseLevel;

                    // Normalize to approximately -1 to 1 based on max expected amplitude (~80W)
                    waveform.push(val / 100);
                }

                // Reshape for Conv1D: [timesteps, features]
                const reshapedWaveform = waveform.map(v => [v]);
                inputs.push(reshapedWaveform);
                labels.push([isHealthy ? 1 : 0]);
            }

            // Explicitly cast to any to avoid strict type mismatch with overloading
            const xs = tf.tensor3d(inputs as any, [numSamples, 100, 1]);
            const ys = tf.tensor2d(labels as any, [numSamples, 1]);

            return { xs, ys };
        });
    }

    // 3. Train
    async train(onEpochEnd?: (metrics: ModelMetrics) => void) {
        if (this.isTraining) return;
        this.isTraining = true;

        if (!this.model) this.createModel();

        const BATCH_SIZE = 64;
        const EPOCHS = 30; // Increased from 15
        const SAMPLES = 2000; // Increased from 500

        const { xs, ys } = this.generateData(SAMPLES);

        await this.model!.fit(xs, ys, {
            batchSize: BATCH_SIZE,
            epochs: EPOCHS,
            shuffle: true,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    if (onEpochEnd && logs) {
                        onEpochEnd({
                            epoch: epoch + 1,
                            loss: logs.loss,
                            accuracy: logs.acc
                        });
                    }
                }
            }
        });

        this.isTraining = false;
        xs.dispose();
        ys.dispose();
    }

    // 4. Predict
    predict(waveform: number[]): number {
        if (!this.model || this.isTraining) return 0.5; // Default neutral

        return tf.tidy(() => {
            // Normalize input same as training data
            const normalized = waveform.map(v => [v / 100]); // [100, 1]
            const input = tf.tensor3d([normalized] as any, [1, 100, 1]);
            const output = this.model!.predict(input) as tf.Tensor;
            const score = output.dataSync()[0];
            return score;
        });
    }
}

export const cnnManager = new HealthModel();
