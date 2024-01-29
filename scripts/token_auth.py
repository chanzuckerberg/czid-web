#!/usr/bin/env python3

import boto3
from botocore.exceptions import ClientError
import os
import json
import argparse
import time
from jwcrypto.jwk import JWK
from jwcrypto import jwe, jwt, jwk
from typing_extensions import TypedDict, List

# Generate a ES-384 private key with:
# openssl ecparam -name secp384r1 -genkey -noout -out tmp/czid-private-key.pem

PRIVATE_KEY_PATH = "/tmp/czid-private-key.pem"


class ProjectRole(TypedDict):
    project_id: int
    roles: List[str]


def fetch_private_key():
    if os.path.isfile(PRIVATE_KEY_PATH):
        return

    env = os.environ.get("ENVIRONMENT")
    secret_name = f"{env}/czid-services-private-key"

    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(service_name="secretsmanager", region_name="us-west-2")

    try:
        get_secret_value_response = client.get_secret_value(SecretId=secret_name)
    except ClientError as e:
        raise e

    # Decrypts secret using the associated KMS key and stores the private key in a pem file.
    secret = get_secret_value_response["SecretString"]
    if secret:
        with open(PRIVATE_KEY_PATH, "w") as f:
            f.write(secret)


def get_token_claims(private_key: JWK, token: str) -> dict:
    unpacked_token = jwe.JWE()
    unpacked_token.deserialize(token)
    unpacked_token.decrypt(private_key)
    decrypted_payload = unpacked_token.payload.decode("utf-8")
    required_claims = {"exp": None, "iat": None, "nbf": None}
    decoded_jwt = jwt.JWT(key=private_key, jwt=decrypted_payload, check_claims=required_claims)
    return decoded_jwt.claims


def create_token(private_key: JWK, userid: int, project_claims: ProjectRole = None, expiration: int = 3600) -> str:
    parsed_project_claims = json.loads(project_claims) if project_claims else None

    validate_claims(userid, parsed_project_claims)

    # Wrap the JWT in a JWE encrypted with alg ECDH-ES and enc A256CBC-HS512.
    expires_at = int(time.time()) + expiration
    jwt_payload = {
        "sub": str(userid),
        "iat": int(time.time()),
        "nbf": int(time.time()),
        "exp": expires_at,
        "projects": parsed_project_claims,
    }

    jwt_headers = {
        "alg": "ES384",
        "typ": "JWT",
        "kid": private_key.thumbprint(),
    }

    jwt_token = jwt.JWT(header=jwt_headers, claims=jwt_payload)
    jwt_token.make_signed_token(private_key)
    jwe_payload = jwt_token.serialize(compact=True)

    # Encrypt the JWT created above with a JWE wrapper so that only the intended recipient can read it.
    protected_header = {
        "alg": "ECDH-ES",
        "enc": "A256CBC-HS512",
        "typ": "JWE",
        "kid": private_key.thumbprint(),
    }
    jwe_token = jwe.JWE(jwe_payload, recipient=private_key, protected=protected_header)
    return json.dumps({"token": jwe_token.serialize(compact=True), "expires_at": expires_at})


# TODO: Plug in a library to do runtime type checking, so we don't have to manualy do it.
def validate_claims(user_id: int, projects: ProjectRole):
    if user_id:
        int(user_id)  # assert user_id is a valid integer

    if projects:
        validate_projects(projects)


def validate_projects(projects: ProjectRole):
    if not isinstance(projects, dict):
        raise ValueError("projects must be a dictionary")

    for project_id, roles in projects.items():
        int(project_id)  # assert user_id is a valid integer

        if not isinstance(roles, list):
            raise ValueError("roles must be a list")

        for role in roles:
            valid_roles = set(["owner", "member", "viewer"])
            if not isinstance(role, str):
                raise ValueError("role must be a string")

            if role not in valid_roles:
                raise ValueError("role must be one of owner, member, or viewer")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Handle token generation & decryption", formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    parser.add_argument("--create_token", action="store_true", help="Create a token")
    parser.add_argument("--decrypt_token", action="store_true", help="Decrypt a token")
    parser.add_argument("--expiration", type=int, default=3600)
    parser.add_argument("--userid", type=int)
    parser.add_argument("--token", type=str)
    parser.add_argument("--project-claims", type=str)

    args = parser.parse_args()

    fetch_private_key()
    with open(PRIVATE_KEY_PATH, "rb") as pemfile:
        key = jwk.JWK.from_pem(pemfile.read())

    if args.create_token:
        print(create_token(key, args.userid, args.project_claims, args.expiration))
    elif args.decrypt_token:
        print(get_token_claims(key, args.token))
