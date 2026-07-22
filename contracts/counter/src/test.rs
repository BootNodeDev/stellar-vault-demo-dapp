#![cfg(test)]
use super::*;
use soroban_sdk::Env;

#[test]
fn increments_and_reads() {
    let env = Env::default();
    let contract_id = env.register(Counter, ());
    let client = CounterClient::new(&env, &contract_id);

    assert_eq!(client.get(), 0); // sin escribir todavía → default 0
    assert_eq!(client.increment(), 1);
    assert_eq!(client.increment(), 2);
    assert_eq!(client.get(), 2); // el estado persistió entre llamadas
}
