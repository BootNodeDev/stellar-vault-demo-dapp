#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Env, Symbol};

// La clave bajo la que vive el contador en el storage del contrato.
const COUNT: Symbol = symbol_short!("COUNT");

#[contract]
pub struct Counter;

#[contractimpl]
impl Counter {
    /// Incrementa el contador y devuelve el nuevo valor.
    pub fn increment(env: Env) -> u32 {
        let mut count: u32 = env.storage().instance().get(&COUNT).unwrap_or(0);
        count += 1;
        env.storage().instance().set(&COUNT, &count);

        // El storage de instancia paga alquiler (rent/TTL): si no lo extendemos,
        // eventualmente expira y hay que "revivirlo". Detalle en el paso 5.
        env.storage().instance().extend_ttl(100, 200);

        count
    }

    /// Lee el contador sin modificarlo. Solo lectura: no escribe estado.
    pub fn get(env: Env) -> u32 {
        env.storage().instance().get(&COUNT).unwrap_or(0)
    }
}

mod test;
