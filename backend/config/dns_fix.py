"""
DNS Fix for MongoDB Atlas Connection
Apply Google DNS resolver globally for the application
"""
import dns.resolver

def apply_dns_fix():
    """Configure DNS resolver to use Google DNS"""
    resolver = dns.resolver.Resolver()
    resolver.nameservers = ['8.8.8.8', '8.8.4.4']
    dns.resolver.default_resolver = resolver
